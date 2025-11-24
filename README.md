# YouTube Top - 조회수 기반 검색 & 스크립트 추출

YouTube API를 활용한 조회수 기반 비디오 검색과 Whisper를 사용한 음성-텍스트 변환 기능을 제공하는 웹 애플리케이션입니다.

## 🚀 주요 기능

### 📊 YouTube 검색 기능
- 조회수 기반 비디오 검색 및 정렬
- 최소 조회수 필터링
- 검색 기간 설정 (1일, 1주일, 1개월, 커스텀)
- 관련성 점수 기반 정렬
- 한국 트렌드 순위 표시 (1-20위)
- 카테고리별 트렌드 필터링

### 🎤 스크립트 추출 기능
- YouTube 영상 음성을 텍스트로 변환
- Whisper AI 모델 지원 (tiny, base, small, medium, large)
- 실시간 처리 상태 표시
- 자동 임시 파일 정리

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Material-UI (MUI)** - UI 컴포넌트
- **Bootstrap 5** - 반응형 레이아웃
- **Zustand** - 상태 관리

### Backend
- **FastAPI** - Python 웹 프레임워크
- **Whisper** - OpenAI 음성 인식
- **yt-dlp** - YouTube 다운로더
- **uv** - Python 패키지 관리자

## 📋 요구사항

### 시스템 요구사항
- Node.js 18+ 
- Python 3.11+
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

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd youtube-top
```

### 2. Frontend 설정

**의존성 설치:**
```bash
pnpm install
```

**환경 변수 설정:**
```bash
# .env.local 파일 생성
echo "NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here" > .env.local
```

**개발 서버 실행:**
```bash
pnpm dev
```

Frontend는 http://localhost:4000 에서 실행됩니다.

### 3. Backend 설정

**Python 서버 디렉토리로 이동:**
```bash
cd python-server
```

**uv를 사용한 의존성 설치:**
```bash
uv sync
```

**개발 서버 실행:**
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend는 http://localhost:15000 에서 실행됩니다.

### 4. 전체 시스템 실행

**터미널 1 (Frontend):**
```bash
pnpm dev
```

**터미널 2 (Backend):**
```bash
cd python-server
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📖 사용 방법

### YouTube 검색 기능

1. **API 키 설정**
   - `.env.local` 파일에 YouTube Data API v3 키 입력
   - 또는 웹 인터페이스에서 직접 입력

2. **검색 조건 설정**
   - 검색어 입력
   - 최소 조회수 설정
   - 검색 기간 선택
   - 커스텀 날짜 범위 설정 (선택사항)

3. **검색 실행**
   - "검색" 버튼 클릭
   - 결과는 관련성 점수 + 조회수로 정렬

### 트렌드 순위 확인

1. **카테고리 선택**
   - 좌측 트렌드 섹션에서 분야 선택
   - 실제 사용 가능한 카테고리만 표시

2. **순위 확인**
   - 1위부터 20위까지 조회수 순으로 정렬
   - 각 비디오의 제목, 채널, 조회수 표시

### 스크립트 추출 기능

1. **YouTube URL 입력**
   - 실제 비디오 URL 입력 (검색 결과 페이지 URL 제외)
   - 지원 형식: `https://www.youtube.com/watch?v=VIDEO_ID`

2. **Whisper 모델 선택**
   - **tiny**: 가장 빠르지만 정확도 낮음 (약 39MB)
   - **base**: 기본 모델, 권장 (약 74MB)
   - **small**: 더 정확하지만 느림 (약 244MB)
   - **medium**: 높은 정확도 (약 769MB)
   - **large**: 최고 정확도지만 매우 느림 (약 1550MB)

3. **추출 실행**
   - "스크립트 추출 시작" 버튼 클릭
   - 처리 시간과 결과 텍스트 확인

## 🏗️ 프로젝트 구조

```
youtube-top/
├── src/                          # Frontend 소스 코드
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   └── page.tsx             # 메인 페이지
│   ├── components/               # React 컴포넌트
│   │   ├── SearchForm.tsx       # 검색 폼
│   │   ├── SearchResultsSection.tsx # 검색 결과
│   │   ├── TrendingSection.tsx  # 트렌드 섹션
│   │   ├── TrendingItem.tsx     # 트렌드 아이템
│   │   ├── VideoCard.tsx        # 비디오 카드
│   │   └── TranscriptionForm.tsx # 스크립트 추출 폼
│   ├── store/                    # 상태 관리
│   │   └── youtubeStore.ts      # YouTube API 상태
│   └── utils/                    # 유틸리티
│       ├── formatters.ts        # 포맷팅 함수
│       └── transcriptionApi.ts  # 스크립트 추출 API
├── python-server/                # Backend 서버
│   ├── main.py                  # FastAPI 메인 앱
│   ├── run_server.py            # 서버 실행 스크립트
│   ├── pyproject.toml           # Python 프로젝트 설정
│   └── README.md                # Python 서버 문서
├── package.json                  # Node.js 의존성
├── next.config.js               # Next.js 설정
└── README.md                    # 프로젝트 문서
```

## 🔧 API 엔드포인트

### YouTube 검색 API
- **GET** `/api/search` - YouTube 비디오 검색
- **GET** `/api/trending` - 트렌드 비디오 조회
- **GET** `/api/categories` - 카테고리 목록

### 스크립트 추출 API
- **GET** `/health` - 서버 상태 확인
- **GET** `/models` - 사용 가능한 Whisper 모델
- **POST** `/transcribe` - YouTube 스크립트 추출

## 🐛 문제 해결

### Frontend 문제

**1. 404 에러 (정적 자산)**
```bash
# Next.js 캐시 삭제 후 재시작
rm -rf .next
pnpm dev
```

**2. API 키 오류**
- `.env.local` 파일에 올바른 YouTube API 키 설정
- API 키에 YouTube Data API v3 권한 확인

### Backend 문제

**1. FFmpeg 오류**
```bash
# FFmpeg 설치 확인
ffmpeg -version
```

**2. 포트 충돌**
```bash
# 다른 포트로 실행
uv run uvicorn main:app --host 0.0.0.0 --port 8001
```

**3. 메모리 부족**
- 더 작은 Whisper 모델 사용 (tiny, base)
- 시스템 메모리 확인

### 일반 문제

**1. 서버 연결 실패**
- Backend 서버가 실행 중인지 확인
- 포트 8000이 사용 가능한지 확인
- 방화벽 설정 확인

**2. 스크립트 추출 실패**
- 유효한 YouTube URL 확인
- 영상이 공개되어 있는지 확인
- 지역 제한이 있는지 확인

## 📝 개발 가이드

### 새로운 컴포넌트 추가
```bash
# 컴포넌트 생성
touch src/components/NewComponent.tsx
```

### Python 서버 수정
```bash
cd python-server
# 코드 수정 후 자동 재시작 (--reload 옵션)
```

### 환경 변수 추가
```bash
# Frontend (.env.local)
NEXT_PUBLIC_NEW_VAR=value

# Backend (python-server/.env)
NEW_VAR=value
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**개발자**: YouTube Top Team  
**버전**: 1.0.0  
**최종 업데이트**: 2024년 12월 