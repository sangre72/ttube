# YouTube 스크립트 추출 & 키워드 분석 서버

FastAPI 기반의 고성능 YouTube 음성 인식 및 키워드 분석 서버입니다. Whisper AI를 사용한 스크립트 추출과 Naver DataLab을 통한 키워드 트렌드 분석을 제공합니다.

## 🎯 주요 기능

### 🎤 음성 인식 (Whisper AI)
- **다중 모델 지원**: tiny, base, small, medium, large (39MB ~ 1550MB)
- **Whisper.cpp Metal**: Apple Silicon 최적화 (실험적)
- **OpenAI Whisper**: CPU 안정 모드 (기본값)
- **자동 폴백**: Whisper.cpp 실패 시 OpenAI Whisper로 자동 전환

### 📊 키워드 분석
- **Naver DataLab API**: 실시간 검색어 트렌드
- **쇼핑 인사이트**: 카테고리별 키워드 데이터
- **트렌드 분석**: 검색량, 경쟁도, CPC 정보
- **시뮬레이션 모드**: API 없이도 테스트 가능

### ⚡ 성능 최적화
- **스마트 캐시**: 24시간 오디오 파일 캐싱으로 중복 다운로드 방지
- **백그라운드 작업**: 비동기 처리로 서버 응답 속도 향상
- **동적 타임아웃**: 파일 크기에 따른 타임아웃 자동 조절
- **메모리 관리**: 자동 임시 파일 정리

## 🏗️ 아키텍처

```
python-server/
├── main.py                   # FastAPI 메인 애플리케이션
├── constants.py              # 서버 설정 및 상수
├── cache_manager.py          # 오디오 파일 캐시 관리
├── gpu_utils.py              # GPU/CPU 디바이스 관리
├── naver_datalab.py          # Naver DataLab API 통합
├── whisper_cpp_metal.py      # Whisper.cpp Metal 최적화
├── whisper_cpp_utils.py      # Whisper.cpp 유틸리티
├── run_server.py             # 서버 실행 스크립트
├── test_whisper_metal.py     # Metal 성능 테스트
├── pyproject.toml            # Python 프로젝트 설정
├── uv.lock                   # uv 의존성 잠금 파일
└── whisper.cpp/              # Whisper C++ 구현
    ├── models/               # Whisper 모델 파일 (.bin)
    └── build/                # 컴파일된 바이너리
```

## 📋 시스템 요구사항

### 필수 요구사항
- **Python**: 3.11 이상
- **FFmpeg**: 오디오 처리
- **uv**: Python 패키지 관리자

### 권장 사양
- **RAM**: 8GB 이상 (large 모델 사용 시 16GB 권장)
- **디스크**: 10GB 이상 (모델 및 캐시용)
- **CPU**: 멀티코어 프로세서 (4코어 이상 권장)

### 선택 사항
- **Apple Silicon Mac**: Whisper.cpp Metal 최적화 (M1/M2/M3)
- **NVIDIA GPU**: CUDA 지원 (향후 지원 예정)

## 🚀 설치 가이드

### 1. FFmpeg 설치

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
- [FFmpeg 공식 사이트](https://ffmpeg.org/download.html)에서 다운로드
- 시스템 PATH에 추가

### 2. uv 설치 (권장)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows PowerShell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 3. Python 의존성 설치

```bash
cd python-server
uv sync
```

### 4. 환경 변수 설정 (선택사항)

Naver DataLab API를 사용하려면:

```bash
# python-server/.env 파일 생성
cat > .env << EOF
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
EOF
```

> 📝 **API 키 발급**: [naver_api_setup.md](naver_api_setup.md) 참조

## 🎮 실행 방법

### 개발 서버 실행

```bash
cd python-server
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

**서버 주소:**
- API: http://localhost:15000
- 문서: http://localhost:15000/docs
- 상태: http://localhost:15000/health

### 프로덕션 실행

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --workers 4
```

## 📡 API 엔드포인트

### 서버 상태 확인

**`GET /health`**

서버 상태와 설정 정보 반환

**응답 예시:**
```json
{
  "status": "healthy",
  "device": "cpu",
  "whisper_backend": "openai",
  "cache_enabled": true,
  "naver_api_enabled": false
}
```

### Whisper 모델 목록

**`GET /models`**

사용 가능한 Whisper 모델 목록

**응답 예시:**
```json
{
  "models": [
    {
      "name": "tiny",
      "size": "39MB",
      "description": "가장 빠르지만 정확도 낮음"
    },
    {
      "name": "base",
      "size": "74MB",
      "description": "기본 모델 (권장)"
    },
    {
      "name": "large",
      "size": "1550MB",
      "description": "최고 정확도지만 매우 느림"
    }
  ]
}
```

### 스크립트 추출

**`POST /transcribe`**

YouTube 영상에서 음성을 텍스트로 변환

**요청 예시:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "model_size": "base",
  "format_with_timestamps": false,
  "format_with_segments": true
}
```

**파라미터:**
- `youtube_url` (필수): YouTube 영상 URL
- `model_size` (선택): Whisper 모델 크기 (기본: "large")
- `format_with_timestamps` (선택): 타임스탬프 포함 여부 (기본: false)
- `format_with_segments` (선택): 세그먼트로 분할 여부 (기본: true)

**응답 예시:**
```json
{
  "success": true,
  "text": "추출된 텍스트 내용...",
  "processing_time": 15.2,
  "audio_size_mb": 5.8,
  "audio_duration": 180.5,
  "download_time": 3.2,
  "transcription_time": 12.0,
  "from_cache": false
}
```

### 키워드 트렌드 분석

**`POST /keywords/trends`**

Naver DataLab을 통한 키워드 트렌드 분석

**요청 예시:**
```json
{
  "keywords": ["건강", "운동", "다이어트"],
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**응답 예시:**
```json
{
  "success": true,
  "keywords": [
    {
      "text": "건강",
      "value": 95,
      "searchVolume": 1500000,
      "trend": 85.5,
      "competition": "HIGH",
      "cpc": 4.28
    },
    {
      "text": "운동",
      "value": 88,
      "searchVolume": 1200000,
      "trend": 78.3,
      "competition": "MEDIUM",
      "cpc": 3.15
    }
  ]
}
```

### 쇼핑 인사이트

**`GET /keywords/shopping`**

Naver 쇼핑 카테고리별 인기 키워드

**응답 예시:**
```json
{
  "success": true,
  "categories": [
    {
      "name": "패션의류",
      "keywords": ["겨울 코트", "니트", "청바지"]
    },
    {
      "name": "식품",
      "keywords": ["건강식", "프로틴", "비타민"]
    }
  ]
}
```

### 모의 키워드 데이터

**`GET /keywords/mock`**

시뮬레이션된 키워드 데이터 (API 없이 테스트용)

## ⚙️ 설정 가이드

### constants.py 주요 설정

```python
# Whisper 모델 설정
DEFAULT_WHISPER_MODEL = "large"  # 기본 모델

# GPU/CPU 설정
ENABLE_GPU = False                      # GPU 사용 여부
GPU_DEVICE = "cpu"                      # 사용할 디바이스
USE_MPS_ON_APPLE_SILICON = False        # Apple Silicon MPS 사용

# Whisper.cpp 설정
USE_WHISPER_CPP = False                 # Whisper.cpp 사용 여부

# 서버 설정
SERVER_PORT = 15000                     # 서버 포트

# 캐시 설정
CACHE_RETENTION_HOURS = 24              # 캐시 보관 시간
CACHE_CLEANUP_INTERVAL = 3600           # 정리 간격 (초)

# 타임아웃 설정
DEFAULT_TIMEOUT_SECONDS = 300           # 기본 타임아웃 (5분)
MAX_TIMEOUT_SECONDS = 1800              # 최대 타임아웃 (30분)
```

### Whisper 모델 선택 가이드

| 모델 | 크기 | 속도 | 정확도 | 권장 용도 |
|------|------|------|--------|-----------|
| **tiny** | 39MB | ⚡⚡⚡⚡⚡ | ⭐⭐ | 빠른 테스트 |
| **base** | 74MB | ⚡⚡⚡⚡ | ⭐⭐⭐ | 일반 사용 (권장) |
| **small** | 244MB | ⚡⚡⚡ | ⭐⭐⭐⭐ | 높은 정확도 필요 시 |
| **medium** | 769MB | ⚡⚡ | ⭐⭐⭐⭐⭐ | 전문가급 정확도 |
| **large** | 1550MB | ⚡ | ⭐⭐⭐⭐⭐ | 최고 품질 필요 시 |

### 캐시 시스템

서버는 다운로드한 오디오 파일을 자동으로 캐싱합니다:

- **보관 기간**: 24시간
- **캐시 위치**: `./cache/` 디렉토리
- **자동 정리**: 1시간마다
- **중복 방지**: URL 해시 기반

**캐시 수동 정리:**
```bash
rm -rf cache/*
```

## 🧪 테스트

### Whisper Metal 성능 테스트

```bash
cd python-server
uv run python test_whisper_metal.py
```

### API 테스트

```bash
# 서버 상태 확인
curl http://localhost:15000/health

# 모델 목록 확인
curl http://localhost:15000/models

# 스크립트 추출 테스트
curl -X POST http://localhost:15000/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "model_size": "base"
  }'
```

## 🐛 문제 해결

### FFmpeg 오류

**오류:**
```
ERROR: FFmpeg not found
```

**해결:**
```bash
# FFmpeg 설치 확인
ffmpeg -version

# macOS 재설치
brew reinstall ffmpeg

# Ubuntu 재설치
sudo apt install --reinstall ffmpeg
```

### 메모리 부족

**오류:**
```
RuntimeError: Out of memory
```

**해결:**
1. 더 작은 Whisper 모델 사용 (tiny, base)
2. 시스템 메모리 확인 (최소 8GB 권장)
3. 다른 프로그램 종료

### 다운로드 실패

**오류:**
```
ERROR: Video unavailable
```

**해결:**
- YouTube URL 확인 (올바른 형식인지)
- 영상이 공개 상태인지 확인
- 지역 제한 확인
- yt-dlp 업데이트: `pip install -U yt-dlp`

### 포트 충돌

**오류:**
```
ERROR: Port 15000 is already in use
```

**해결:**
```bash
# 사용 중인 프로세스 확인
lsof -i :15000

# 다른 포트로 실행
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Whisper.cpp Metal 오류

**오류:**
```
⚠️ Whisper.cpp Metal을 사용할 수 없습니다
```

**해결:**
- 자동으로 OpenAI Whisper로 폴백됨 (문제 없음)
- Apple Silicon Mac에서만 Metal 사용 가능
- Whisper.cpp 빌드가 필요한 경우 [WHISPER_CPP_SETUP.md](../WHISPER_CPP_SETUP.md) 참조

### CORS 오류

**오류:**
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**해결:**
- Frontend가 `http://localhost:4000`에서 실행 중인지 확인
- `constants.py`의 `ALLOWED_ORIGINS` 확인

## 📊 성능 벤치마크

### 처리 시간 (3분 영상 기준)

| 모델 | M2 Mac | Intel i7 | 메모리 사용량 |
|------|--------|----------|---------------|
| tiny | ~30초 | ~45초 | 500MB |
| base | ~1분 | ~1.5분 | 1GB |
| small | ~2분 | ~3분 | 2GB |
| medium | ~5분 | ~8분 | 4GB |
| large | ~10분 | ~15분 | 8GB |

### 캐시 효과

- **첫 요청**: 다운로드 + 변환
- **캐시 히트**: 변환만 (50-70% 시간 절약)

## 🔒 보안

### CORS 설정

기본적으로 다음 출처만 허용:
- `http://localhost:4000` (Frontend)
- `http://localhost:15000` (Backend)
- `http://127.0.0.1:4000`
- `http://127.0.0.1:15000`

### 데이터 보호

- **임시 파일**: 처리 후 자동 삭제
- **캐시 파일**: 24시간 후 자동 삭제
- **URL 검증**: YouTube URL만 허용
- **API 키**: 환경 변수로 관리

## 🔧 개발 가이드

### 새 엔드포인트 추가

```python
# main.py
@app.post("/new-endpoint")
async def new_endpoint(data: RequestModel):
    """새 API 엔드포인트"""
    try:
        # 처리 로직
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 코드 스타일

```bash
# Black 포맷터
uv run black .

# isort import 정렬
uv run isort .

# Flake8 린터
uv run flake8
```

### 로깅

```python
import logging
logger = logging.getLogger(__name__)

logger.info("정보 메시지")
logger.warning("경고 메시지")
logger.error("에러 메시지")
```

## 📚 추가 문서

- [Naver DataLab API 설정](naver_api_setup.md)
- [Whisper C++ 빌드 가이드](../WHISPER_CPP_SETUP.md)
- [환경 변수 설정](../ENV_SETUP.md)

## 📈 로드맵

### v1.1 (계획 중)
- [ ] CUDA GPU 지원
- [ ] WebSocket 실시간 스트리밍
- [ ] 다중 언어 지원 강화
- [ ] Redis 캐시 통합

### v1.2 (계획 중)
- [ ] 배치 처리 API
- [ ] 오디오 품질 자동 조절
- [ ] Prometheus 메트릭
- [ ] Docker 컨테이너 지원

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 참조

---

**개발**: YouTube Top Team
**버전**: 1.0.0
**Python**: 3.11+
**FastAPI**: 0.104+
