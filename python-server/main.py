"""
YouTube 스크립트 추출 서버
Whisper와 yt-dlp를 사용하여 YouTube 영상의 음성을 텍스트로 변환
"""

import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional
import logging
from dotenv import load_dotenv
import os
import subprocess
import json
import time

# .env.local 파일 로드 (프로젝트 루트에 있음)
load_dotenv('../.env.local')

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
# whisper import will be done conditionally later
import yt_dlp

from constants import (
    DEFAULT_WHISPER_MODEL,
    DEFAULT_FORMAT_WITH_SEGMENTS,
    DEFAULT_FORMAT_WITH_TIMESTAMPS,
    AUDIO_QUALITY,
    AUDIO_CODEC,
    SERVER_HOST,
    SERVER_PORT,
    ALLOWED_ORIGINS,
    DEFAULT_TIMEOUT_SECONDS,
    MAX_TIMEOUT_SECONDS,
    TIMEOUT_PER_MB_SECONDS
)
from gpu_utils import get_safe_device, log_device_info
from cache_manager import cache_manager
from naver_datalab import naver_datalab_service

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Whisper.cpp Metal 지원 확인
USE_WHISPER_CPP = False
whisper_cpp_module = None
whisper_cpp_instances = {}  # 모델별 인스턴스 캐시
try:
    from whisper_cpp_metal import WhisperCppMetal
    whisper_cpp_module = WhisperCppMetal
    USE_WHISPER_CPP = True
    logger.info("✅ Whisper.cpp Metal 활성화됨")
except Exception as e:
    logger.warning(f"⚠️ Whisper.cpp Metal을 사용할 수 없습니다: {e}")
    logger.info("💡 OpenAI Whisper를 사용합니다")

# 서버 시작 시 디바이스 정보 출력
log_device_info()

# FastAPI 앱 생성
app = FastAPI(
    title="YouTube 스크립트 추출 서버",
    description="YouTube 영상의 음성을 텍스트로 변환하는 API 서버",
    version="1.0.0"
)

# CORS 설정 (프론트엔드에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 모델
class TranscriptionRequest(BaseModel):
    youtube_url: HttpUrl
    model_size: Optional[str] = DEFAULT_WHISPER_MODEL
    format_with_timestamps: Optional[bool] = DEFAULT_FORMAT_WITH_TIMESTAMPS
    format_with_segments: Optional[bool] = DEFAULT_FORMAT_WITH_SEGMENTS

# 응답 모델
class TranscriptionResponse(BaseModel):
    success: bool
    text: Optional[str] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None
    audio_size_mb: Optional[float] = None
    audio_duration: Optional[float] = None
    download_time: Optional[float] = None
    transcription_time: Optional[float] = None
    from_cache: Optional[bool] = None

# Whisper 모델 캐시
whisper_models = {}

def get_whisper_model(model_size: str = DEFAULT_WHISPER_MODEL):
    """Whisper 모델을 가져오거나 캐시에서 로드 (CPU 모드)"""
    if model_size not in whisper_models:
        logger.info(f"Whisper 모델 로딩 중: {model_size} (CPU 모드)")
        
        try:
            import whisper
            whisper_models[model_size] = whisper.load_model(model_size, device="cpu")
            logger.info(f"Whisper 모델 로딩 완료: {model_size} (CPU)")
        except Exception as e:
            logger.error(f"모델 로딩 실패: {e}")
            raise
    
    return whisper_models[model_size]

def download_audio(youtube_url: str, output_path: str) -> tuple[bool, dict]:
    """
    YouTube 영상에서 오디오 추출 (캐시 지원)
    
    Args:
        youtube_url: YouTube URL
        output_path: 출력 파일 경로
        
    Returns:
        (성공 여부, 파일 정보)
    """
    try:
        # 1. 캐시에서 파일 확인
        cached_file = cache_manager.get_cached_file(youtube_url)
        if cached_file:
            logger.info(f"캐시된 파일 사용: {youtube_url}")
            
            # 캐시된 파일을 임시 디렉토리로 복사
            import shutil
            temp_audio_file = output_path.replace('%(ext)s', 'mp3')
            shutil.copy2(cached_file, temp_audio_file)
            
            # 파일 크기 계산
            file_size = os.path.getsize(temp_audio_file)
            file_size_mb = file_size / (1024 * 1024)
            
            # 캐시 메타데이터에서 duration 가져오기
            cache_key = cache_manager._generate_cache_key(youtube_url)
            duration = cache_manager.metadata.get(cache_key, {}).get('duration', 0)
            
            return True, {
                'file_path': temp_audio_file,
                'size_mb': file_size_mb,
                'duration': duration,
                'from_cache': True
            }
        
        # 2. 캐시에 없으면 새로 다운로드
        logger.info(f"새로운 오디오 다운로드 시작: {youtube_url}")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': AUDIO_CODEC,
                'preferredquality': AUDIO_QUALITY,
            }],
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 먼저 정보만 가져오기
            info = ydl.extract_info(youtube_url, download=False)
            duration = info.get('duration', 0)
            
            # 실제 다운로드
            ydl.download([youtube_url])
        
        # 실제 파일 경로 확인 (확장자가 mp3로 변경됨)
        audio_file = output_path.replace('%(ext)s', 'mp3')
        if os.path.exists(audio_file):
            # 파일 크기 계산
            file_size = os.path.getsize(audio_file)
            file_size_mb = file_size / (1024 * 1024)
            
            # 캐시에 저장
            cache_manager.cache_file(youtube_url, audio_file, duration)
            
            logger.info(f"오디오 다운로드 완료: {audio_file} ({file_size_mb:.2f}MB, {duration}초)")
            return True, {
                'file_path': audio_file,
                'size_mb': file_size_mb,
                'duration': duration,
                'from_cache': False
            }
        else:
            logger.error(f"오디오 파일을 찾을 수 없음: {audio_file}")
            return False, {}
            
    except Exception as e:
        logger.error(f"오디오 다운로드 실패: {str(e)}")
        return False, {}

def format_time(seconds: float) -> str:
    """초를 MM:SS 형식으로 변환"""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def format_transcription_text(text: str) -> str:
    """
    음성 인식 결과 텍스트를 읽기 쉽게 포맷팅
    
    Args:
        text: 원본 텍스트
        
    Returns:
        포맷팅된 텍스트
    """
    # 기본 문장 구분자로 분할
    sentences = []
    current_sentence = ""
    
    # 마침표, 느낌표, 물음표로 문장 구분
    for char in text:
        current_sentence += char
        if char in ['.', '!', '?', '。', '！', '？']:
            sentences.append(current_sentence.strip())
            current_sentence = ""
    
    # 마지막 문장이 있다면 추가
    if current_sentence.strip():
        sentences.append(current_sentence.strip())
    
    # 빈 문장 제거하고 줄바꿈으로 연결
    formatted_text = '\n'.join([s for s in sentences if s])
    
    return formatted_text

def format_transcription_with_segments(result: dict, with_timestamps: bool = False) -> str:
    """
    Whisper 결과의 세그먼트 정보를 활용하여 포맷팅
    
    Args:
        result: Whisper transcribe 결과
        with_timestamps: 시간 정보 포함 여부
        
    Returns:
        포맷팅된 텍스트
    """
    if "segments" not in result:
        # 세그먼트 정보가 없으면 기본 포맷팅 사용
        return format_transcription_text(result["text"].strip())
    
    formatted_lines = []
    
    for segment in result["segments"]:
        text = segment["text"].strip()
        if not text:
            continue
            
        if with_timestamps:
            start_time = format_time(segment["start"])
            end_time = format_time(segment["end"])
            line = f"[{start_time}-{end_time}] {text}"
        else:
            line = text
            
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)

import signal
import threading
from contextlib import contextmanager

@contextmanager
def timeout_context(seconds):
    """타임아웃 컨텍스트 매니저"""
    def timeout_handler(signum, frame):
        raise TimeoutError(f"작업이 {seconds}초 후 타임아웃되었습니다")
    
    # Unix 시스템에서만 signal 사용
    if hasattr(signal, 'SIGALRM'):
        old_handler = signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(seconds)
        try:
            yield
        finally:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)
    else:
        # Windows나 다른 시스템에서는 단순히 yield
        yield

def transcribe_audio(audio_path: str, model_size: str = DEFAULT_WHISPER_MODEL, format_with_segments: bool = DEFAULT_FORMAT_WITH_SEGMENTS, format_with_timestamps: bool = DEFAULT_FORMAT_WITH_TIMESTAMPS) -> Optional[str]:
    """
    오디오 파일을 텍스트로 변환 (타임아웃 및 강화된 에러 처리)
    
    Args:
        audio_path: 오디오 파일 경로
        model_size: Whisper 모델 크기
        format_with_segments: 세그먼트별 줄바꿈 여부
        format_with_timestamps: 시간 정보 포함 여부
        
    Returns:
        변환된 텍스트 또는 None
    """
    try:
        logger.info(f"음성 인식 시작: {audio_path}")
        
        # 실제 파일 경로 확인
        if not os.path.exists(audio_path):
            # 확장자 변경 시도
            audio_path = audio_path.replace('%(ext)s', 'mp3')
            if not os.path.exists(audio_path):
                logger.error(f"오디오 파일을 찾을 수 없음: {audio_path}")
                return None
        
        # 파일 크기 확인
        file_size = os.path.getsize(audio_path)
        file_size_mb = file_size / (1024 * 1024)
        logger.info(f"오디오 파일 크기: {file_size_mb:.2f}MB")
        
        # 파일 크기가 너무 크면 경고
        if file_size_mb > 100:  # 100MB 이상
            logger.warning(f"오디오 파일이 매우 큽니다: {file_size_mb:.2f}MB. 처리 시간이 오래 걸릴 수 있습니다.")
        
        # Whisper.cpp Metal 사용 가능한 경우
        if USE_WHISPER_CPP:
            logger.info("🚀 Whisper.cpp Metal 사용 (GPU 가속)")
            try:
                # 모델별 인스턴스 가져오기 또는 생성
                if model_size not in whisper_cpp_instances:
                    logger.info(f"Whisper.cpp {model_size} 모델 초기화 중...")
                    # medium 모델이 손상된 경우 large 모델 사용
                    actual_model = model_size
                    if model_size == "medium":
                        actual_model = "large-v3"
                        logger.warning(f"medium 모델 대신 {actual_model} 모델 사용")
                    whisper_cpp_instances[model_size] = whisper_cpp_module(model_size=actual_model)
                
                whisper_cpp = whisper_cpp_instances[model_size]
                
                # 음성 인식 실행
                result = whisper_cpp.transcribe(
                    audio_path=audio_path,
                    language="ko",  # 한국어로 명시적 설정
                    no_timestamps=not format_with_timestamps
                )
                
                if result["success"]:
                    text = result["text"]
                    
                    # 세그먼트 포맷팅이 필요한 경우
                    if format_with_segments and result.get("segments"):
                        segments = result["segments"]
                        if format_with_timestamps:
                            formatted_lines = []
                            for seg in segments:
                                if isinstance(seg, dict) and "text" in seg:
                                    start = seg.get("start", 0)
                                    end = seg.get("end", 0)
                                    text_content = seg["text"].strip()
                                    if text_content:
                                        formatted_lines.append(f"[{format_time(start)}-{format_time(end)}] {text_content}")
                                else:
                                    formatted_lines.append(str(seg))
                            text = '\n'.join(formatted_lines)
                        else:
                            text = '\n'.join([seg.get("text", "").strip() for seg in segments if isinstance(seg, dict)])
                    
                    logger.info(f"Whisper.cpp Metal 음성 인식 완료: {len(text)} 문자")
                    return text
                else:
                    logger.error(f"Whisper.cpp 오류: {result.get('error', 'Unknown error')}")
                    # OpenAI Whisper로 폴백
                    logger.info("OpenAI Whisper로 폴백")
            except Exception as e:
                logger.error(f"Whisper.cpp 실행 중 오류: {e}")
                logger.info("OpenAI Whisper로 폴백")
        
        # CPU 모드로 OpenAI Whisper 사용 (폴백 또는 기본)
        logger.info("CPU 모드로 OpenAI Whisper 사용")
        model = get_whisper_model(model_size)
        
        # 타임아웃 설정 (파일 크기에 따라 조정)
        timeout_seconds = min(
            MAX_TIMEOUT_SECONDS,
            max(DEFAULT_TIMEOUT_SECONDS, int(file_size_mb * TIMEOUT_PER_MB_SECONDS))
        )
        logger.info(f"타임아웃 설정: {timeout_seconds}초 (파일 크기: {file_size_mb:.2f}MB)")
        
        # 타임아웃과 함께 음성 인식 실행
        with timeout_context(timeout_seconds):
            result = model.transcribe(audio_path)
        
        raw_text = result["text"].strip()
        
        # 텍스트 포맷팅 적용
        if format_with_segments:
            formatted_text = format_transcription_with_segments(result, format_with_timestamps)
        else:
            formatted_text = format_transcription_text(raw_text)
        
        logger.info(f"OpenAI Whisper 음성 인식 완료: {len(raw_text)} 문자 -> {len(formatted_text)} 문자 (포맷팅됨)")
        return formatted_text
        
    except TimeoutError as e:
        logger.error(f"음성 인식 타임아웃: {str(e)}")
        return None
    except MemoryError as e:
        logger.error(f"메모리 부족으로 음성 인식 실패: {str(e)}")
        return None
    except Exception as e:
        error_msg = str(e)
        logger.error(f"음성 인식 실패: {error_msg}")
        return None

def cleanup_files(file_path: str):
    """임시 파일 정리"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"파일 삭제됨: {file_path}")
    except Exception as e:
        logger.error(f"파일 삭제 실패: {str(e)}")

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "YouTube 스크립트 추출 서버",
        "version": "1.0.0",
        "endpoints": {
            "POST /transcribe": "YouTube URL로부터 스크립트 추출",
            "GET /health": "서버 상태 확인"
        }
    }

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    from gpu_utils import get_device_info
    
    device_info = get_device_info()
    
    # Whisper 모드 정보
    whisper_info = {
        "mode": "Metal GPU" if USE_WHISPER_CPP else "CPU",
        "whisper_cpp": USE_WHISPER_CPP,
        "message": "Metal GPU 가속 활성화 (고속 처리)" if USE_WHISPER_CPP else "CPU 모드로 안정적으로 실행 중",
        "loaded_models": list(whisper_cpp_instances.keys()) if USE_WHISPER_CPP else []
    }
    
    return {
        "status": "healthy", 
        "message": "서버가 정상적으로 동작 중입니다 (CPU 모드)",
        "device_info": device_info,
        "whisper": whisper_info
    }

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_youtube_video(
    request: TranscriptionRequest,
    background_tasks: BackgroundTasks
):
    """
    YouTube 영상의 스크립트 추출 (개선된 버전)
    
    Args:
        request: YouTube URL과 모델 크기
        background_tasks: 백그라운드 작업 (파일 정리용)
        
    Returns:
        변환된 텍스트 또는 에러 메시지
    """
    import time
    start_time = time.time()
    download_start_time = None
    transcription_start_time = None
    
    # 임시 디렉토리 생성
    temp_dir = tempfile.mkdtemp()
    audio_path = os.path.join(temp_dir, "audio.%(ext)s")
    
    try:
        # 1. YouTube URL에서 오디오 다운로드
        youtube_url = str(request.youtube_url)
        download_start_time = time.time()
        
        download_success, audio_info = download_audio(youtube_url, audio_path)
        if not download_success:
            raise HTTPException(status_code=400, detail="오디오 다운로드에 실패했습니다")
        
        download_time = time.time() - download_start_time
        logger.info(f"다운로드 완료: {download_time:.2f}초")
        
        # 2. 오디오를 텍스트로 변환
        transcription_start_time = time.time()
        text = transcribe_audio(
            audio_path, 
            request.model_size,
            format_with_segments=request.format_with_segments,
            format_with_timestamps=request.format_with_timestamps
        )
        
        if text is None:
            raise HTTPException(status_code=500, detail="음성 인식에 실패했습니다")
        
        transcription_time = time.time() - transcription_start_time
        total_time = time.time() - start_time
        
        logger.info(f"음성 인식 완료: {transcription_time:.2f}초 (총 {total_time:.2f}초)")
        
        # 3. 백그라운드에서 임시 파일 정리
        background_tasks.add_task(cleanup_files, audio_path.replace('%(ext)s', 'mp3'))
        background_tasks.add_task(shutil.rmtree, temp_dir)
        
        return TranscriptionResponse(
            success=True,
            text=text,
            processing_time=total_time,
            audio_size_mb=audio_info.get('size_mb'),
            audio_duration=audio_info.get('duration'),
            download_time=download_time,
            transcription_time=transcription_time,
            from_cache=audio_info.get('from_cache', False)
        )
        
    except HTTPException:
        # HTTPException은 그대로 재발생
        raise
    except TimeoutError as e:
        logger.error(f"타임아웃 오류: {str(e)}")
        # 임시 파일 정리
        background_tasks.add_task(cleanup_files, audio_path.replace('%(ext)s', 'mp3'))
        background_tasks.add_task(shutil.rmtree, temp_dir)
        raise HTTPException(status_code=408, detail=f"처리 시간이 초과되었습니다: {str(e)}")
    except MemoryError as e:
        logger.error(f"메모리 부족 오류: {str(e)}")
        # 임시 파일 정리
        background_tasks.add_task(cleanup_files, audio_path.replace('%(ext)s', 'mp3'))
        background_tasks.add_task(shutil.rmtree, temp_dir)
        raise HTTPException(status_code=507, detail="메모리 부족으로 처리할 수 없습니다. 더 작은 파일을 시도해주세요.")
    except Exception as e:
        # 기타 예외 처리
        logger.error(f"처리 중 오류 발생: {str(e)}")
        
        # 임시 파일 정리
        background_tasks.add_task(cleanup_files, audio_path.replace('%(ext)s', 'mp3'))
        background_tasks.add_task(shutil.rmtree, temp_dir)
        
        raise HTTPException(
            status_code=500, 
            detail=f"처리 중 오류가 발생했습니다: {str(e)}"
        )

@app.get("/models")
async def get_available_models():
    """사용 가능한 Whisper 모델 목록"""
    return {
        "models": [
            {"name": "medium", "description": "높은 정확도, Metal 가속 지원"},
            {"name": "large", "description": "최고 정확도, Metal 가속 지원 (large-v3)"}
        ],
        "loaded_models": list(whisper_models.keys())
    }

@app.get("/cache/info")
async def get_cache_info():
    """캐시 정보 조회"""
    return cache_manager.get_cache_info()

@app.delete("/cache/clear")
async def clear_cache():
    """모든 캐시 삭제"""
    cache_manager.clear_all_cache()
    return {"message": "모든 캐시가 삭제되었습니다."}

# 네이버 데이터랩 관련 모델
class KeywordTrendRequest(BaseModel):
    keywords: List[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class KeywordTrendResponse(BaseModel):
    success: bool
    keywords: List[dict]
    error: Optional[str] = None

@app.post("/keywords/trends", response_model=KeywordTrendResponse)
async def get_keyword_trends(request: KeywordTrendRequest):
    """네이버 데이터랩에서 키워드 트렌드 데이터 가져오기"""
    try:
        keywords = naver_datalab_service.get_search_trends(
            keywords=request.keywords,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        return KeywordTrendResponse(
            success=True,
            keywords=keywords
        )
    except Exception as e:
        logger.error(f"키워드 트렌드 데이터 가져오기 실패: {e}")
        return KeywordTrendResponse(
            success=False,
            keywords=[],
            error=str(e)
        )

@app.get("/keywords/shopping")
async def get_shopping_insights():
    """네이버 쇼핑 인사이트 데이터 가져오기"""
    try:
        keywords = naver_datalab_service.get_shopping_insights()
        return {
            "success": True,
            "keywords": keywords
        }
    except Exception as e:
        logger.error(f"쇼핑 인사이트 데이터 가져오기 실패: {e}")
        return {
            "success": False,
            "keywords": [],
            "error": str(e)
        }

@app.get("/keywords/mock")
async def get_mock_keyword_data():
    """시뮬레이션된 키워드 데이터 반환 (테스트용)"""
    try:
        keywords = naver_datalab_service._get_mock_trend_data([])
        return {
            "success": True,
            "keywords": keywords
        }
    except Exception as e:
        logger.error(f"모의 키워드 데이터 가져오기 실패: {e}")
        return {
            "success": False,
            "keywords": [],
            "error": str(e)
        }

@app.post("/keywords/related")
async def get_related_keywords(request: dict):
    """메인 키워드와 관련 키워드의 트렌드 데이터 가져오기"""
    try:
        main_keyword = request.get("keyword", "")
        include_related = request.get("include_related", True)
        max_related = request.get("max_related", 10)
        
        if not main_keyword:
            return {"success": False, "error": "키워드가 필요합니다."}
        
        keywords = naver_datalab_service.get_search_trends_with_related(
            main_keyword=main_keyword,
            include_related=include_related,
            max_related=max_related
        )
        
        return {"success": True, "keywords": keywords}
    except Exception as e:
        logger.error(f"관련 키워드 데이터 가져오기 실패: {e}")
        return {"success": False, "keywords": [], "error": str(e)}

# Claude CLI 평가 요청 모델
class ContentEvaluationRequest(BaseModel):
    content: str
    title: Optional[str] = None
    category: Optional[str] = None
    evaluation_type: Optional[str] = "comprehensive"  # comprehensive, simple, category_specific

class ContentEvaluationResponse(BaseModel):
    success: bool
    evaluation: Optional[dict] = None
    error: Optional[str] = None
    processing_time: Optional[float] = None
    result: Optional[str] = None  # Claude CLI의 원본 텍스트 응답

@app.post("/evaluate/content", response_model=ContentEvaluationResponse)
async def evaluate_content(request: ContentEvaluationRequest):
    """Claude CLI를 사용하여 콘텐츠 평가"""
    import time
    start_time = time.time()
    
    try:
        
        # 평가 프롬프트 생성
        if request.evaluation_type == "simple":
            prompt = f"""콘텐츠: {request.content}

YouTube 영상 콘텐츠로서 1-10점 평가:
- 재미도 (시청자가 재미있어할까?)
- 정보성 (유용한 정보를 제공하는가?)
- 바이럴 가능성 (공유하고 싶은 콘텐츠인가?)
- 제작 난이도 (실제 만들기 어려운가?)

JSON 형식으로 응답해주세요."""
        else:  # comprehensive
            prompt = f"""다음 콘텐츠를 객관적으로 평가해주세요.

콘텐츠: {request.content}
{f'제목: {request.title}' if request.title else ''}
{f'카테고리: {request.category}' if request.category else ''}

다음 기준으로 1-10점 척도로 평가하고 구체적인 이유를 제시해주세요:

1. 재미도 (Entertainment Value): 시청자의 흥미를 유발하고 지속시킬 수 있는가?
2. 사실성 (Factual Accuracy): 정보의 정확성과 신뢰성은 어떠한가?
3. 흥미도 (Engagement Level): 시청자가 끝까지 볼 가능성은 얼마나 되는가?
4. 독창성 (Originality): 기존 콘텐츠와 차별화되는 독특한 요소가 있는가?
5. 실용성 (Practical Value): 시청자에게 실질적 도움이나 가치를 제공하는가?
6. 트렌드 적합성 (Trend Relevance): 현재 트렌드와 얼마나 잘 맞는가?
7. 타겟 명확성 (Target Clarity): 목표 시청자층이 명확하고 그들에게 적합한가?
8. 제작 가능성 (Production Feasibility): 실제 제작이 현실적으로 가능한가?

JSON 형식으로 응답해주세요:
{{
  "총평": "한 문장 종합 평가",
  "점수": {{
    "재미도": {{"점수": 0, "이유": ""}},
    "사실성": {{"점수": 0, "이유": ""}},
    "흥미도": {{"점수": 0, "이유": ""}},
    "독창성": {{"점수": 0, "이유": ""}},
    "실용성": {{"점수": 0, "이유": ""}},
    "트렌드_적합성": {{"점수": 0, "이유": ""}},
    "타겟_명확성": {{"점수": 0, "이유": ""}},
    "제작_가능성": {{"점수": 0, "이유": ""}}
  }},
  "평균_점수": 0,
  "강점": ["강점1", "강점2"],
  "개선점": ["개선점1", "개선점2"],
  "추천_액션": "구체적인 다음 단계 제안"
}}"""

        # Claude CLI 명령어 구성
        cmd = [
            "claude",
            "-p",
            prompt
        ]
        
        # 터미널에 요청 내용 출력
        print("\n" + "="*80)
        print("[Claude CLI 요청]")
        print(f"시간: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"평가 타입: {request.evaluation_type}")
        if request.title:
            print(f"제목: {request.title}")
        if request.category:
            print(f"카테고리: {request.category}")
        print(f"콘텐츠 길이: {len(request.content)} 문자")
        print(f"프롬프트 길이: {len(prompt)} 문자")
        print("명령어:", ' '.join(cmd[:3]) + " [프롬프트 생략]")
        print("="*80)
        
        logger.info(f"Claude CLI 호출 시작")
        
        # subprocess로 Claude CLI 실행
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60초 타임아웃
        )
        
        if result.returncode != 0:
            logger.error(f"Claude CLI 오류: {result.stderr}")
            print(f"\n[오류] Claude CLI 실행 실패: {result.stderr}")
            print("="*80 + "\n")
            raise Exception(f"Claude CLI 실행 실패: {result.stderr}")
        
        # JSON 파싱
        try:
            # Claude CLI의 출력에서 JSON 부분만 추출
            output = result.stdout.strip()
            
            # JSON 부분만 추출 (코드블록 제거)
            if '```json' in output:
                json_start = output.find('```json') + 7
                json_end = output.find('```', json_start)
                output = output[json_start:json_end].strip()
            elif output.startswith('{'):
                pass  # 이미 JSON 형태
            else:
                # JSON 찾기
                json_start = output.find('{')
                json_end = output.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    output = output[json_start:json_end]
                else:
                    raise ValueError("Claude CLI가 JSON 형식으로 응답하지 않았습니다.")
            
            evaluation_data = json.loads(output)
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error(f"JSON 파싱 오류: {e}")
            logger.error(f"원본 응답: {result}")
            raise Exception(f"응답 파싱 실패: {str(e)}")
        
        processing_time = time.time() - start_time
        logger.info(f"콘텐츠 평가 완료: {processing_time:.2f}초")
        
        # 터미널에 결과 요약 출력
        print(f"\n[성공] Claude CLI 응답 수신")
        print(f"처리 시간: {processing_time:.2f}초")
        if 'total_score' in evaluation_data or '평균_점수' in evaluation_data:
            score = evaluation_data.get('total_score') or evaluation_data.get('평균_점수', 0)
            print(f"평가 점수: {score}/10")
        if '총평' in evaluation_data:
            print(f"총평: {evaluation_data['총평']}")
        print("="*80 + "\n")
        
        # Claude CLI의 원본 텍스트 응답도 함께 반환
        return ContentEvaluationResponse(
            success=True,
            evaluation=evaluation_data,
            processing_time=processing_time,
            result=result.stdout.strip()  # 원본 텍스트 응답 추가
        )
        
    except subprocess.TimeoutExpired:
        logger.error("Claude CLI 타임아웃")
        print(f"\n[오류] Claude CLI 타임아웃 (60초 초과)")
        print("="*80 + "\n")
        return ContentEvaluationResponse(
            success=False,
            error="평가 처리 시간이 초과되었습니다.",
            processing_time=time.time() - start_time
        )
    except Exception as e:
        logger.error(f"콘텐츠 평가 실패: {str(e)}")
        print(f"\n[오류] 콘텐츠 평가 실패: {str(e)}")
        print("="*80 + "\n")
        return ContentEvaluationResponse(
            success=False,
            error=str(e),
            processing_time=time.time() - start_time
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT) 