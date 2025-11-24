"""
Whisper.cpp 유틸리티
Apple Silicon Mac에서 Metal을 통한 최적화된 음성 인식
"""

import os
import subprocess
import logging
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class WhisperCPP:
    """Whisper.cpp 래퍼 클래스"""
    
    def __init__(self, whisper_cpp_path: str, models_path: str):
        self.whisper_cpp_path = Path(whisper_cpp_path)
        self.models_path = Path(models_path)
        self.binary_path = self.whisper_cpp_path / "build" / "bin" / "whisper-cli"
        
    def is_available(self) -> bool:
        """Whisper.cpp가 사용 가능한지 확인"""
        return self.binary_path.exists()
    
    def get_available_models(self) -> list:
        """사용 가능한 모델 목록 반환"""
        models = []
        if self.models_path.exists():
            for model_file in self.models_path.glob("ggml-*.bin"):
                model_name = model_file.stem.replace("ggml-", "")
                models.append(model_name)
                logger.info(f"발견된 모델: {model_name} ({model_file.name})")
        return models
    
    def get_best_available_model(self, requested_model: str) -> str:
        """요청된 모델 중 사용 가능한 최고 품질 모델 반환"""
        available_models = self.get_available_models()
        
        if not available_models:
            logger.warning("사용 가능한 모델이 없습니다")
            return None
        
        # 모델 품질 순서 (높은 순)
        model_quality_order = [
            "large-v3", "large-v1", "medium", "medium.en", 
            "small", "small.en", "base", "base.en", 
            "tiny", "tiny.en"
        ]
        
        # 요청된 모델과 유사한 모델 찾기
        requested_base = requested_model.split('.')[0]  # "medium.en" -> "medium"
        
        # 1. 정확히 일치하는 모델 찾기
        if requested_model in available_models:
            logger.info(f"정확히 일치하는 모델 사용: {requested_model}")
            return requested_model
        
        # 2. 같은 기본 모델의 다른 버전 찾기 (예: medium.en -> medium)
        for model in model_quality_order:
            if model.startswith(requested_base) and model in available_models:
                logger.info(f"유사한 모델 사용: {requested_model} -> {model}")
                return model
        
        # 3. 사용 가능한 최고 품질 모델 사용
        for model in model_quality_order:
            if model in available_models:
                logger.info(f"최고 품질 모델 사용: {requested_model} -> {model}")
                return model
        
        # 4. 마지막 수단: 첫 번째 사용 가능한 모델
        fallback_model = available_models[0]
        logger.warning(f"폴백 모델 사용: {requested_model} -> {fallback_model}")
        return fallback_model
    
    def download_model(self, model_name: str) -> bool:
        """모델 다운로드"""
        try:
            script_path = self.whisper_cpp_path / "models" / "download-ggml-model.sh"
            if script_path.exists():
                result = subprocess.run(
                    [str(script_path), model_name],
                    cwd=self.whisper_cpp_path,
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    logger.info(f"모델 다운로드 완료: {model_name}")
                    return True
                else:
                    logger.error(f"모델 다운로드 실패: {result.stderr}")
                    return False
            else:
                logger.error("다운로드 스크립트를 찾을 수 없습니다")
                return False
        except Exception as e:
            logger.error(f"모델 다운로드 중 오류: {e}")
            return False
    
    def transcribe(self, audio_path: str, model_name: str = "base.en", 
                   language: str = "auto", output_format: str = "txt") -> Optional[str]:
        """
        오디오 파일을 텍스트로 변환
        
        Args:
            audio_path: 오디오 파일 경로
            model_name: 모델 이름 (base.en, medium.en 등)
            language: 언어 코드 (auto, ko, en 등)
            output_format: 출력 형식 (txt, json, srt 등)
            
        Returns:
            변환된 텍스트 또는 None
        """
        try:
            # 사용 가능한 최적의 모델 선택
            best_model = self.get_best_available_model(model_name)
            if not best_model:
                logger.error("사용 가능한 모델이 없습니다")
                return None
            
            # 모델 파일 경로 확인
            model_file = self.models_path / f"ggml-{best_model}.bin"
            if not model_file.exists():
                logger.warning(f"모델 파일이 없습니다: {model_file}")
                # 자동 다운로드 시도
                if not self.download_model(best_model):
                    logger.error(f"모델 다운로드 실패: {best_model}")
                    return None
            
            # 임시 출력 파일 생성
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as tmp_file:
                output_path = tmp_file.name
            
            # Whisper.cpp 명령어 구성
            cmd = [
                str(self.binary_path),
                "-m", str(model_file),
                "-f", audio_path,
                "-otxt",  # 텍스트 출력
                "-l", language,
                "-of", output_path
            ]
            
            # Metal 사용 설정
            env = os.environ.copy()
            env["GGML_METAL"] = "1"
            
            logger.info(f"Whisper.cpp 실행: {' '.join(cmd)}")
            
            # 명령어 실행
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5분 타임아웃
            )
            
            if result.returncode == 0:
                # 결과 파일 읽기
                if os.path.exists(output_path):
                    with open(output_path, 'r', encoding='utf-8') as f:
                        text = f.read().strip()
                    
                    # 임시 파일 삭제
                    os.unlink(output_path)
                    
                    logger.info(f"Whisper.cpp 변환 완료: {len(text)} 문자")
                    return text
                else:
                    logger.error("출력 파일을 찾을 수 없습니다")
                    return None
            else:
                logger.error(f"Whisper.cpp 실행 실패: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            logger.error("Whisper.cpp 실행 시간 초과")
            return None
        except Exception as e:
            logger.error(f"Whisper.cpp 실행 중 오류: {e}")
            return None

def get_whisper_cpp_instance() -> Optional[WhisperCPP]:
    """Whisper.cpp 인스턴스 생성"""
    from constants import USE_WHISPER_CPP, WHISPER_CPP_PATH, WHISPER_CPP_MODELS_PATH
    
    if not USE_WHISPER_CPP:
        return None
    
    try:
        whisper_cpp = WhisperCPP(WHISPER_CPP_PATH, WHISPER_CPP_MODELS_PATH)
        if whisper_cpp.is_available():
            logger.info("Whisper.cpp 사용 가능")
            return whisper_cpp
        else:
            logger.warning("Whisper.cpp 바이너리를 찾을 수 없습니다")
            return None
    except Exception as e:
        logger.error(f"Whisper.cpp 초기화 실패: {e}")
        return None

def convert_model_name(model_name: str) -> str:
    """OpenAI Whisper 모델명을 Whisper.cpp 모델명으로 변환"""
    model_mapping = {
        "tiny": "tiny.en",
        "base": "base.en", 
        "small": "small.en",
        "medium": "medium.en",
        "large": "large-v3"
    }
    return model_mapping.get(model_name, "base.en") 