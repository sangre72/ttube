# YouTube Top - 영상 콘텐츠 아이디어 생성 도구

YouTube 트렌드 분석과 AI 기반 스크립트 추출을 결합하여 콘텐츠 크리에이터의 영상 기획을 돕는 웹 애플리케이션입니다.

[![GitHub](https://img.shields.io/badge/GitHub-sangre72%2Fttube-blue?logo=github)](https://github.com/sangre72/ttube)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

## 🎯 프로젝트 목적

**YouTube Top**은 영상 콘텐츠 아이디어 생성을 위한 도구로, 콘텐츠 크리에이터가 트렌딩 주제를 발견하고 성공적인 영상 전략을 분석할 수 있도록 설계되었습니다.

### 콘텐츠 제작 워크플로우

1. **트렌드 발견** → 조회수별 YouTube 영상 검색으로 트렌딩 콘텐츠 파악
2. **카테고리 분석** → 분야별 필터링으로 틈새 시장 트렌드 이해
3. **스크립트 추출** → Whisper AI로 성공적인 영상의 대본 추출
4. **키워드 분석** → 키워드 클라우드와 Naver DataLab으로 트렌드 데이터 생성
5. **AI 강화** → Claude, Grok, OpenAI를 활용한 콘텐츠 요약/확장/개선/번역
6. **아이디어 생성** → 성공 패턴을 분석하여 새로운 영상 아이디어 개발

## 🚀 주요 기능

### 📊 YouTube 트렌드 분석
- **조회수 기반 검색**: 최소 조회수 필터링으로 인기 콘텐츠 발견
- **기간별 검색**: 1일/1주일/1개월/커스텀 기간 설정
- **카테고리별 트렌드**: 음악, 게임, 교육 등 20개 카테고리
- **관련성 점수**: 검색어 관련성과 조회수를 결합한 스마트 정렬
- **실시간 순위**: 한국 트렌드 Top 20 표시

### 🎤 AI 기반 스크립트 추출
- **Whisper AI 통합**: OpenAI Whisper 모델로 음성을 텍스트로 변환
- **다중 모델 지원**: tiny, base, small, medium, large 모델 선택
- **실시간 처리**: 진행 상황 표시 및 자동 캐시 관리
- **yt-dlp 통합**: 안정적인 YouTube 오디오 다운로드

### 🤖 AI 콘텐츠 강화
- **요약(Summarize)**: 긴 스크립트를 핵심 포인트로 압축
- **확장(Expand)**: 짧은 내용을 풍부하게 확장
- **개선(Improve)**: 문법과 표현을 자연스럽게 수정
- **번역(Translate)**: 다양한 언어로 번역
- **AI 모델 선택**: Claude (Anthropic), Grok (X.AI), GPT (OpenAI) 지원

### 📈 키워드 트렌드 분석
- **키워드 클라우드**: D3.js 기반 시각화
- **Naver DataLab API**: 검색량, 트렌드, 경쟁도, CPC 데이터
- **쇼핑 인사이트**: 카테고리별 키워드 분석
- **트렌드 데이터**: 시간별 키워드 변화 추적

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** with App Router
- **TypeScript** - 타입 안전성
- **Bootstrap 5** - 반응형 UI
- **Zustand** - 경량 상태 관리
- **Axios** - HTTP 클라이언트
- **React WordCloud** - 키워드 시각화

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **OpenAI Whisper** - 음성 인식 AI
- **yt-dlp** - YouTube 다운로더
- **uv** - 빠른 Python 패키지 관리
- **Naver DataLab API** - 키워드 트렌드 데이터

### AI/ML
- **Anthropic Claude** - 텍스트 분석 및 생성
- **X.AI Grok** - 기본 AI 모델
- **OpenAI GPT** - 대체 AI 모델
- **Whisper** - 음성 인식

## 📋 시스템 요구사항

- **Node.js** 18 이상
- **Python** 3.11 이상
- **pnpm** (권장 패키지 매니저)
- **FFmpeg** (오디오 처리)
- **uv** (Python 패키지 관리)

### FFmpeg 설치

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
- [FFmpeg 공식 사이트](https://ffmpeg.org/download.html)에서 다운로드 후 PATH 추가

## 🚀 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone https://github.com/sangre72/ttube.git
cd ttube
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 API 키를 설정하세요:

```bash
# .env.example을 복사하여 시작
cp .env.example .env.local
```

`.env.local` 파일 내용:
```bash
# YouTube Data API v3
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# AI API Keys (선택사항 - 필요한 것만 설정)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
NEXT_PUBLIC_GROK_API_KEY=xai-your_grok_key

# Naver DataLab API (선택사항)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

> 📝 **API 키 발급 방법**은 [ENV_SETUP.md](ENV_SETUP.md) 문서를 참조하세요.

### 3. Frontend 설정

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# 개발 서버 실행 (포트 4000)
pnpm dev
```

Frontend: **http://localhost:4000**

### 4. Backend 설정

```bash
cd python-server

# uv 설치 (없는 경우)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 의존성 설치
uv sync

# 개발 서버 실행 (포트 15000)
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

Backend: **http://localhost:15000**

### 5. 전체 시스템 실행

**터미널 1 (Frontend):**
```bash
pnpm dev
```

**터미널 2 (Backend):**
```bash
cd python-server
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

## 📖 사용 가이드

### 1. YouTube 트렌드 검색

1. **검색어 입력**: 관심 주제 키워드 입력
2. **조회수 필터**: 최소 조회수 설정 (예: 1만, 10만, 100만)
3. **기간 설정**: 1일/1주일/1개월 또는 커스텀 날짜
4. **카테고리 선택**: 좌측 트렌드 섹션에서 분야 선택
5. **결과 분석**: 조회수 순위와 관련성 점수 확인

### 2. 스크립트 추출

1. **YouTube URL 입력**: `https://www.youtube.com/watch?v=VIDEO_ID` 형식
2. **Whisper 모델 선택**:
   - `tiny` (39MB): 가장 빠름, 기본 정확도
   - `base` (74MB): 권장 - 속도와 정확도 균형
   - `small` (244MB): 높은 정확도
   - `medium` (769MB): 전문가급 정확도
   - `large` (1550MB): 최고 정확도, 느림
3. **추출 시작**: 처리 시간은 영상 길이와 모델 크기에 따라 다름
4. **결과 확인**: 추출된 텍스트 복사 또는 AI 강화 적용

### 3. AI 콘텐츠 강화

스크립트 추출 후 AI 강화 기능 사용:

1. **AI 모델 선택**: Claude / Grok / OpenAI
2. **강화 유형 선택**:
   - **요약**: 핵심 내용을 2-3문장으로 압축
   - **확장**: 배경 정보와 예시를 추가하여 확장
   - **개선**: 문법과 표현을 자연스럽게 수정
   - **번역**: 다양한 언어로 번역
3. **결과 활용**: 강화된 텍스트를 콘텐츠 기획에 활용

### 4. 키워드 트렌드 분석

1. **키워드 클라우드**: 추출된 스크립트에서 주요 키워드 시각화
2. **Naver DataLab**: 키워드별 검색량, 트렌드, 경쟁도 확인
3. **쇼핑 인사이트**: 카테고리별 인기 키워드 분석
4. **트렌드 데이터**: 시간별 키워드 변화 추적

## 🏗️ 프로젝트 구조

```
ttube/
├── src/                              # Frontend 소스
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   └── page.tsx                 # 메인 페이지
│   ├── components/                   # React 컴포넌트
│   │   ├── SearchForm.tsx           # YouTube 검색 폼
│   │   ├── SearchResultsSection.tsx # 검색 결과 표시
│   │   ├── TrendingSection.tsx      # 트렌드 순위
│   │   ├── TrendingItem.tsx         # 트렌드 항목
│   │   ├── VideoCard.tsx            # 비디오 카드
│   │   ├── TranscriptionForm.tsx    # 스크립트 추출 폼
│   │   ├── AIEnhancementSection.tsx # AI 강화 기능
│   │   └── KeywordCloud.tsx         # 키워드 클라우드
│   ├── store/                        # Zustand 상태 관리
│   │   ├── youtubeStore.ts          # YouTube API 상태
│   │   └── tabStore.ts              # UI 탭 상태
│   └── utils/                        # 유틸리티 함수
│       ├── formatters.ts            # 포맷팅 함수
│       ├── transcriptionApi.ts      # 스크립트 추출 API
│       ├── aiEnhancement.ts         # AI 강화 API
│       └── naverDatalabApi.ts       # Naver DataLab API
├── python-server/                    # Backend 서버
│   ├── main.py                      # FastAPI 메인
│   ├── cache_manager.py             # 캐시 관리
│   ├── constants.py                 # 설정 상수
│   ├── gpu_utils.py                 # GPU 유틸리티
│   ├── naver_datalab.py             # Naver API 통합
│   ├── pyproject.toml               # Python 설정
│   └── whisper.cpp/                 # Whisper C++ 구현
├── .env.example                      # 환경 변수 템플릿
├── .env.local                        # 환경 변수 (로컬, gitignore됨)
├── .gitignore                        # Git 제외 파일
├── package.json                      # Node.js 의존성
├── next.config.js                   # Next.js 설정
├── CLAUDE.md                        # Claude Code 가이드
├── ENV_SETUP.md                     # 환경 변수 설정 가이드
└── README.md                        # 프로젝트 문서
```

## 🔧 API 엔드포인트

### Backend API (http://localhost:15000)

**서버 상태:**
- `GET /health` - 서버 헬스 체크

**Whisper 스크립트 추출:**
- `GET /models` - 사용 가능한 Whisper 모델 목록
- `POST /transcribe` - YouTube 스크립트 추출
  ```json
  {
    "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "model": "base"
  }
  ```

**Naver DataLab API:**
- `POST /keywords/trends` - 키워드 트렌드 데이터
- `GET /keywords/shopping` - 쇼핑 인사이트

### Frontend API Routes

- YouTube 검색은 클라이언트 사이드에서 직접 YouTube Data API v3 호출
- AI 강화는 각 AI 제공자의 API 직접 호출

## 🐛 문제 해결

### Frontend 문제

**포트 충돌:**
```bash
# 다른 포트로 실행
pnpm dev -- -p 3000
```

**API 키 오류:**
- `.env.local` 파일 확인
- YouTube Data API v3 권한 확인
- API 키 할당량 확인

**Next.js 캐시 문제:**
```bash
rm -rf .next
pnpm dev
```

### Backend 문제

**FFmpeg 없음:**
```bash
# FFmpeg 설치 확인
ffmpeg -version

# macOS 재설치
brew reinstall ffmpeg
```

**포트 15000 충돌:**
```bash
# 다른 포트 사용
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Whisper 모델 다운로드 실패:**
- 인터넷 연결 확인
- `~/.cache/whisper` 폴더 확인
- 수동으로 모델 다운로드 후 캐시에 배치

**메모리 부족:**
- 더 작은 모델 사용 (tiny, base)
- 시스템 메모리 확인 (최소 8GB 권장)

### 일반 문제

**CORS 오류:**
- Backend 서버 실행 확인 (http://localhost:15000)
- FastAPI CORS 설정 확인

**스크립트 추출 실패:**
- 유효한 YouTube URL 확인
- 영상이 공개 상태인지 확인
- 지역 제한 확인
- yt-dlp 업데이트: `pip install -U yt-dlp`

## 📝 개발 가이드

### 코드 스타일

**Frontend (TypeScript):**
```bash
pnpm lint
```

**Backend (Python):**
```bash
cd python-server
uv run black .
uv run isort .
uv run flake8
```

### 새 기능 추가

**Frontend 컴포넌트:**
```bash
touch src/components/NewFeature.tsx
```

**Backend 엔드포인트:**
```python
# python-server/main.py
@app.post("/new-endpoint")
async def new_endpoint():
    return {"status": "success"}
```

### 환경 변수 추가

1. `.env.example`에 새 변수 추가
2. `.env.local`에 실제 값 설정
3. 코드에서 `process.env.NEXT_PUBLIC_NEW_VAR` 사용

## 🤝 기여하기

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- **GitHub Issues**: [https://github.com/sangre72/ttube/issues](https://github.com/sangre72/ttube/issues)
- **Documentation**: [CLAUDE.md](CLAUDE.md) - Claude Code 가이드
- **Environment Setup**: [ENV_SETUP.md](ENV_SETUP.md) - API 키 설정 가이드

## 🎓 추가 문서

- [ENV_SETUP.md](ENV_SETUP.md) - 환경 변수 및 API 키 설정
- [CLAUDE.md](CLAUDE.md) - Claude Code 개발 가이드
- [WHISPER_CPP_SETUP.md](WHISPER_CPP_SETUP.md) - Whisper C++ 설정
- [python-server/naver_api_setup.md](python-server/naver_api_setup.md) - Naver API 설정

---

**개발자**: YouTube Top Team
**버전**: 1.0.0
**GitHub**: [https://github.com/sangre72/ttube](https://github.com/sangre72/ttube)
**최종 업데이트**: 2024년 12월
