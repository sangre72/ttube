#!/usr/bin/env python3
"""
Whisper.cpp Metal 통합 모듈
Mac Metal GPU 가속을 사용하여 빠른 음성 인식 제공
"""

import os
import subprocess
import json
import logging
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class WhisperCppMetal:
    def __init__(self, model_size: str = "base"):
        """
        Whisper.cpp Metal 초기화
        
        Args:
            model_size: 모델 크기 (tiny, base, small, medium, large)
        """
        self.base_dir = Path(__file__).parent / "whisper.cpp"
        self.whisper_cli = self.base_dir / "build" / "bin" / "whisper-cli"
        self.models_dir = self.base_dir / "models"
        self.model_size = model_size
        
        # 실행 파일 확인
        if not self.whisper_cli.exists():
            raise FileNotFoundError(f"whisper-cli not found at {self.whisper_cli}")
        
        # 모델 파일 경로 - 다국어 모델 우선 선택
        # large 모델의 경우 v3 버전 우선 선택
        if model_size == "large":
            # large 모델은 v3와 v1이 있음
            for variant in ["v3", "v1", ""]:
                suffix = f"-{variant}" if variant else ""
                candidate = self.models_dir / f"ggml-{model_size}{suffix}.bin"
                if candidate.exists():
                    self.model_path = candidate
                    break
        else:
            self.model_path = self.models_dir / f"ggml-{model_size}.bin"
        
        if not self.model_path.exists():
            # 영어 전용 모델 시도
            self.model_path = self.models_dir / f"ggml-{model_size}.en.bin"
            if not self.model_path.exists():
                # for-tests 모델은 마지막 대안 (테스트용이므로)
                self.model_path = self.models_dir / f"for-tests-ggml-{model_size}.bin"
                if not self.model_path.exists():
                    # 모든 가능한 모델 목록 출력
                    available_models = list(self.models_dir.glob("*.bin"))
                    logger.error(f"Model not found: {model_size}")
                    logger.error(f"Available models: {[m.name for m in available_models]}")
                    raise FileNotFoundError(f"Model not found: {self.model_path}")
                else:
                    logger.warning(f"⚠️ 테스트용 모델 사용 중: {self.model_path.name}")
        
        logger.info(f"Whisper.cpp Metal initialized with model: {self.model_path}")
    
    def transcribe(
        self, 
        audio_path: str, 
        language: str = "ko",  # 기본값을 한국어로 변경
        translate: bool = False,
        output_format: str = "text",
        temperature: float = 0.0,
        beam_size: int = 5,
        best_of: int = 5,
        word_timestamps: bool = False,
        no_timestamps: bool = False,
        threads: int = 4
    ) -> Dict[str, Any]:
        """
        오디오 파일을 텍스트로 변환
        
        Args:
            audio_path: 오디오 파일 경로
            language: 언어 코드 (auto, en, ko, ja, etc.)
            translate: 영어로 번역 여부
            output_format: 출력 형식 (text, json, srt, vtt)
            temperature: 샘플링 온도 (0.0-1.0)
            beam_size: 빔 검색 크기
            best_of: 최선의 후보 수
            word_timestamps: 단어별 타임스탬프
            no_timestamps: 타임스탬프 제거
            threads: 사용할 스레드 수
            
        Returns:
            변환 결과 딕셔너리
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # 임시 출력 파일
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_output:
            output_path = tmp_output.name
        
        try:
            # whisper-cli 명령어 구성
            cmd = [
                str(self.whisper_cli),
                "-m", str(self.model_path),
                "-f", audio_path,
                "-l", language,
                "-t", str(threads),
                "-bs", str(beam_size),
                "-bo", str(best_of),
                "-tp", str(temperature),
                "-oj",  # JSON 출력
                "-of", output_path.replace(".json", ""),  # 출력 파일 경로 (확장자 제외)
                "-np"   # 진행 상황 출력 안 함
            ]
            
            # 옵션 추가
            if translate:
                cmd.append("-tr")
            if no_timestamps:
                cmd.append("-nt")
            if word_timestamps:
                cmd.extend(["-ml", "0"])  # 단어별 타임스탬프 활성화
            
            logger.info(f"Running whisper.cpp: {' '.join(cmd)}")
            
            # 프로세스 실행
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False  # 에러가 있어도 일단 결과를 확인하자
            )
            
            # 실행 결과 로깅
            logger.info(f"whisper-cli return code: {result.returncode}")
            if result.stdout:
                logger.info(f"whisper-cli stdout: {result.stdout[:500]}...")
            if result.stderr:
                logger.warning(f"whisper-cli stderr: {result.stderr[:500]}...")
            
            # JSON 결과 읽기
            if os.path.exists(output_path):
                try:
                    with open(output_path, 'r', encoding='utf-8') as f:
                        json_content = f.read()
                        logger.info(f"JSON file content: {json_content[:200]}...")
                        json_result = json.loads(json_content)
                    
                    # 텍스트 추출
                    text = ""
                    if "transcription" in json_result:
                        segments = json_result["transcription"]
                        if isinstance(segments, list):
                            text = " ".join([seg.get("text", "") for seg in segments])
                        else:
                            text = str(segments)
                    
                    return {
                        "success": True,
                        "text": text.strip(),
                        "segments": json_result.get("transcription", []),
                        "language": json_result.get("language", language),
                        "processing_time": json_result.get("processing_time", 0)
                    }
                except Exception as e:
                    logger.error(f"JSON parsing error: {e}")
                    # JSON 파싱 실패시 stdout 사용
                    return {
                        "success": True,
                        "text": result.stdout.strip(),
                        "segments": [],
                        "language": language
                    }
            else:
                logger.warning(f"JSON output file not found: {output_path}")
                # 텍스트만 반환된 경우
                return {
                    "success": True,
                    "text": result.stdout.strip(),
                    "segments": [],
                    "language": language
                }
                
        except subprocess.CalledProcessError as e:
            logger.error(f"Whisper.cpp error: {e.stderr}")
            return {
                "success": False,
                "error": f"Transcription failed: {e.stderr}",
                "text": ""
            }
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "text": ""
            }
        finally:
            # 임시 파일 정리
            for ext in [".json", ".txt", ".srt", ".vtt"]:
                tmp_file = output_path.replace(".json", ext)
                if os.path.exists(tmp_file):
                    os.remove(tmp_file)
    
    def download_model(self, model_size: str):
        """
        모델 다운로드 (필요한 경우)
        """
        script_path = self.base_dir / "models" / "download-ggml-model.sh"
        if script_path.exists():
            subprocess.run([str(script_path), model_size], check=True)
        else:
            logger.warning("Model download script not found")
    
    def get_available_models(self) -> list:
        """
        사용 가능한 모델 목록 반환
        """
        models = []
        for model_file in self.models_dir.glob("ggml-*.bin"):
            model_name = model_file.stem.replace("ggml-", "")
            models.append({
                "name": model_name,
                "path": str(model_file),
                "size": model_file.stat().st_size / (1024 * 1024)  # MB
            })
        return models


# 테스트 코드
if __name__ == "__main__":
    # 로깅 설정
    logging.basicConfig(level=logging.INFO)
    
    # Whisper.cpp Metal 초기화
    whisper = WhisperCppMetal(model_size="base")
    
    # 사용 가능한 모델 확인
    print("Available models:")
    for model in whisper.get_available_models():
        print(f"  - {model['name']}: {model['size']:.1f} MB")
    
    # 테스트 파일이 있다면 변환 테스트
    test_audio = "samples/jfk.wav"
    if os.path.exists(test_audio):
        print(f"\nTranscribing {test_audio}...")
        result = whisper.transcribe(test_audio)
        if result["success"]:
            print(f"Text: {result['text']}")
        else:
            print(f"Error: {result['error']}")