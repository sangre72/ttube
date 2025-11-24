"""
YouTube 스크립트 추출 서버 상수 정의
"""

# Whisper 모델 관련 상수
DEFAULT_WHISPER_MODEL = "large"
AVAILABLE_WHISPER_MODELS = [
    "tiny",
    "base", 
    "small",
    "medium",
    "large"
]

# Whisper 모델 설명
WHISPER_MODEL_DESCRIPTIONS = {
    "tiny": "가장 빠르지만 정확도 낮음 (39MB)",
    "base": "기본 모델 (74MB)",
    "small": "더 정확하지만 느림 (244MB)",
    "medium": "높은 정확도 (769MB)",
    "large": "최고 정확도지만 매우 느림 (1550MB)"
}

# GPU 설정 - CPU 모드로 설정
ENABLE_GPU = False  # GPU 사용 여부 (CPU 모드)
GPU_DEVICE = "cpu"  # cpu로 고정
MPS_FALLBACK_TO_CPU = True  # MPS 오류 시 CPU로 폴백
# Apple Silicon Mac에서 MPS 안정성 문제로 인해 기본적으로 CPU 사용
USE_MPS_ON_APPLE_SILICON = False  # Apple Silicon에서 MPS 사용 여부

# Whisper.cpp 설정 (Apple Silicon 최적화) - CPU 모드로 설정
USE_WHISPER_CPP = False  # whisper.cpp 사용 여부 (CPU 모드로 비활성화)
WHISPER_CPP_PATH = "./whisper.cpp"  # whisper.cpp 설치 경로
WHISPER_CPP_MODELS_PATH = "./whisper.cpp/models"  # 모델 경로

# 기본 설정값
DEFAULT_FORMAT_WITH_SEGMENTS = True
DEFAULT_FORMAT_WITH_TIMESTAMPS = False

# 오디오 품질 설정
AUDIO_QUALITY = "192"
AUDIO_CODEC = "mp3"

# 서버 설정
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 15000

# 타임아웃 설정
DEFAULT_TIMEOUT_SECONDS = 300  # 기본 5분
MAX_TIMEOUT_SECONDS = 1800     # 최대 30분
TIMEOUT_PER_MB_SECONDS = 10    # MB당 10초 추가

# 파일 캐시 설정
CACHE_DIR = "./cache"  # 캐시 디렉토리
CACHE_RETENTION_HOURS = 24  # 캐시 보관 시간 (시간)
CACHE_CLEANUP_INTERVAL = 3600  # 캐시 정리 간격 (초)

# CORS 설정
ALLOWED_ORIGINS = [
    "http://localhost:4000",
    "http://localhost:15000", 
    "http://127.0.0.1:4000",
    "http://127.0.0.1:15000"
] 