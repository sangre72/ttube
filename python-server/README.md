# YouTube 스크립트 추출 & 네이버 데이터랩 키워드 분석 서버

Whisper와 yt-dlp를 사용하여 YouTube 영상의 음성을 텍스트로 변환하고, 네이버 데이터랩 API를 통해 키워드 분석을 제공하는 FastAPI 서버입니다.

## 🚀 기능

- YouTube 영상에서 오디오 추출
- Whisper를 사용한 음성 인식
- 다양한 Whisper 모델 지원 (tiny, base, small, medium, large)
- RESTful API 제공
- 자동 임시 파일 정리
- **네이버 데이터랩 API 연동**
- **검색어 트렌드 분석**
- **쇼핑 인사이트 데이터**
- **실시간 키워드 트렌드**

## 📋 요구사항

- Python 3.8 이상
- FFmpeg (오디오 처리용)

### FFmpeg 설치

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
- [FFmpeg 공식 사이트](https://ffmpeg.org/download.html)에서 다운로드
- 시스템 PATH에 추가

## 🛠️ 설치

1. **의존성 설치:**
```bash
cd python-server
uv sync
```

2. **네이버 데이터랩 API 설정 (선택사항):**
```bash
# 환경 변수 설정
export NAVER_CLIENT_ID="your_client_id"
export NAVER_CLIENT_SECRET="your_client_secret"
```

3. **서버 실행:**
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

또는 직접 실행:
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

## 📡 API 엔드포인트

### 서버 상태 확인
```
GET /health
```

### 사용 가능한 모델 목록
```
GET /models
```

### 스크립트 추출
```
POST /transcribe
```

**요청 예시:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "model_size": "base"
}
```

**응답 예시:**
```json
{
  "success": true,
  "text": "추출된 텍스트 내용...",
  "processing_time": 15.2
}
```

### 키워드 트렌드 분석
```
POST /keywords/trends
```

**요청 예시:**
```json
{
  "keywords": ["건강", "운동"],
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
    }
  ]
}
```

### 쇼핑 인사이트
```
GET /keywords/shopping
```

네이버 쇼핑 인사이트 데이터를 반환합니다.

### 모의 키워드 데이터
```
GET /keywords/mock
```

시뮬레이션된 키워드 데이터를 반환합니다 (API 설정이 없는 경우 사용).

## 🎯 사용법

1. **서버 시작:**
```bash
cd python-server
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

2. **브라우저에서 확인:**
- 서버 주소: http://localhost:15000
- API 문서: http://localhost:15000/docs
- 서버 상태: http://localhost:15000/health

## 🔑 네이버 데이터랩 API 설정

### 1. 네이버 개발자 센터에서 인증 정보 발급

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속
2. 애플리케이션 등록
3. 데이터랩 API 서비스 추가
4. Client ID와 Client Secret 발급

### 2. 환경 변수 설정

```bash
# .env 파일 생성 또는 환경 변수 설정
export NAVER_CLIENT_ID="your_client_id"
export NAVER_CLIENT_SECRET="your_client_secret"
```

### 3. API 설정 확인

API 설정이 완료되면 실제 네이버 데이터랩 데이터를 가져올 수 있습니다.
설정이 없으면 자동으로 시뮬레이션 데이터를 사용합니다.

### 4. 네이버 데이터랩 API 특징

- **검색어 트렌드**: 최근 30일간의 검색어 트렌드 데이터
- **쇼핑 인사이트**: 네이버 쇼핑 관련 키워드 분석
- **실시간 데이터**: 네이버 검색 기반의 실시간 트렌드

3. **프론트엔드에서 사용:**
- Next.js 앱에서 자동으로 서버 상태 확인
- YouTube URL 입력 후 스크립트 추출 버튼 클릭

## 🔧 설정

### Whisper 모델 크기

- **tiny**: 가장 빠르지만 정확도 낮음 (약 39MB)
- **base**: 기본 모델, 권장 (약 74MB)
- **small**: 더 정확하지만 느림 (약 244MB)
- **medium**: 높은 정확도 (약 769MB)
- **large**: 최고 정확도지만 매우 느림 (약 1550MB)

### 환경 변수

필요한 경우 `.env` 파일을 생성하여 설정:

```env
# 서버 포트 (기본값: 8000)
PORT=8000

# 로그 레벨 (기본값: info)
LOG_LEVEL=info
```

## 🐛 문제 해결

### 1. FFmpeg 오류
```
ERROR: FFmpeg not found
```
**해결:** FFmpeg를 설치하고 PATH에 추가

### 2. 메모리 부족
```
RuntimeError: CUDA out of memory
```
**해결:** 더 작은 Whisper 모델 사용 (tiny, base)

### 3. 다운로드 실패
```
ERROR: Video unavailable
```
**해결:** 
- YouTube URL 확인
- 영상이 공개되어 있는지 확인
- 지역 제한이 있는지 확인

### 4. 서버 연결 실패
```
Connection refused
```
**해결:**
- 서버가 실행 중인지 확인
- 포트 8000이 사용 가능한지 확인
- 방화벽 설정 확인

## 📝 로그

서버는 다음 정보를 로그로 출력합니다:
- 오디오 다운로드 진행 상황
- Whisper 모델 로딩 상태
- 음성 인식 진행 상황
- 처리 시간
- 오류 정보

## 🔒 보안

- CORS 설정으로 localhost:4000에서만 접근 허용
- 임시 파일은 자동으로 정리됨
- 입력 URL 유효성 검사

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 