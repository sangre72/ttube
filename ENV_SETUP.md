# 환경 변수 설정 가이드

## AI API 키 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```bash
# AI API Keys
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_GROK_API_KEY=your_grok_api_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# API Endpoints
NEXT_PUBLIC_TRANSCRIPTION_API_URL=http://localhost:8000
```

**💡 Grok API**: 기본 AI 모델로 설정되어 있으며, 최신 `grok-3-latest` 모델을 사용합니다.

**💡 Whisper**: CPU 모드로 안정적으로 실행됩니다. Metal 최적화는 나중에 추가 예정입니다.

## GPU 설정 (Python 서버)

Python 서버는 현재 CPU 모드로 설정되어 안정적으로 실행됩니다:

### 현재 설정:
- **CPU 모드**: 안정적인 CPU 처리 (기본값)
- **GPU 비활성화**: Metal/CUDA 사용 안함
- **Whisper.cpp 비활성화**: OpenAI Whisper만 사용

### 향후 지원 예정:
- **CUDA**: NVIDIA GPU (Windows/Linux)
- **Metal (MPS)**: Apple Silicon GPU (macOS) - 최대 3배 빠른 성능
- **Whisper.cpp**: Apple Silicon 최적화

### Apple Silicon Mac 최적화:
Apple Silicon Mac에서는 안정성과 성능의 균형을 고려하여 최적화된 설정을 제공합니다:

- **자동 감지**: Apple Silicon Mac 자동 감지
- **안정성 우선**: 기본적으로 CPU 모드 사용 (안정성 보장)
- **MPS 옵션**: 설정을 통해 MPS 사용 가능 (실험적)
- **자동 폴백**: MPS 오류 시 자동으로 CPU로 전환
- **Apple Silicon CPU**: M1/M2/M3 칩의 고성능 CPU 활용

**성능 비교**:
- **Apple Silicon CPU**: 매우 빠른 처리 속도 (M1/M2/M3 칩 최적화)
- **MPS (실험적)**: 이론적으로 더 빠르지만 안정성 문제 가능
- **일반 CPU**: 표준 처리 속도

### 현재 CPU 모드 설정:
`python-server/constants.py` 파일에서 현재 설정:

```python
# GPU 설정 - CPU 모드로 설정
ENABLE_GPU = False             # GPU 사용 여부 (CPU 모드)
GPU_DEVICE = "cpu"             # cpu로 고정
MPS_FALLBACK_TO_CPU = True     # MPS 오류 시 CPU로 폴백
USE_MPS_ON_APPLE_SILICON = False  # Apple Silicon에서 MPS 사용 여부

# Whisper.cpp 설정 - CPU 모드로 설정
USE_WHISPER_CPP = False        # whisper.cpp 사용 여부 (CPU 모드로 비활성화)
```

### Apple Silicon Mac에서 MPS 사용하기:
MPS를 사용하고 싶다면 `USE_MPS_ON_APPLE_SILICON = True`로 설정하세요:

```python
# Apple Silicon Mac에서 MPS 사용
USE_MPS_ON_APPLE_SILICON = True
```

**주의**: MPS는 일부 PyTorch 연산을 완전히 지원하지 않아 오류가 발생할 수 있습니다. 
오류 발생 시 자동으로 CPU로 폴백되지만, 안정성을 위해 기본적으로 CPU 모드를 권장합니다.

### GPU 사용 확인:
서버 시작 시 로그에서 다음과 같은 메시지를 확인할 수 있습니다:
- `Apple Silicon Mac 감지됨`
- `Metal GPU (MPS) 사용 가능 - Apple Silicon 최적화 모드`
- `🚀 Apple Silicon 최적화 모드 활성화`
- `CUDA GPU 감지됨: [GPU 이름]`
- `GPU 없음, CPU 사용`

```bash
# AI API Keys
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_GROK_API_KEY=your_grok_api_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# API Endpoints
NEXT_PUBLIC_TRANSCRIPTION_API_URL=http://localhost:8000
```

## API 키 획득 방법

### 1. Claude API 키 (Anthropic)
1. [Anthropic Console](https://console.anthropic.com/)에 접속
2. 계정 생성 또는 로그인
3. API Keys 섹션에서 새 API 키 생성
4. 생성된 키를 `NEXT_PUBLIC_ANTHROPIC_API_KEY`에 설정

### 2. Grok API 키 (X.AI) - 기본 모델
1. [X.AI Console](https://console.x.ai/)에 접속
2. 계정 생성 또는 로그인
3. API Keys 섹션에서 새 API 키 생성
4. 생성된 키를 `NEXT_PUBLIC_GROK_API_KEY`에 설정

**💡 기본 모델**: Grok이 기본 AI 모델로 설정되어 있으며, `grok-3-latest` 모델을 사용합니다.

### 3. OpenAI API 키 - Grok 대안
1. [OpenAI Platform](https://platform.openai.com/)에 접속
2. 계정 생성 또는 로그인
3. API Keys 섹션에서 새 API 키 생성
4. 생성된 키를 `NEXT_PUBLIC_OPENAI_API_KEY`에 설정

## Grok API 설정

### 기본 모델:
- Grok이 기본 AI 모델로 설정되어 있습니다
- `grok-3-latest` 모델을 사용합니다
- system 메시지와 함께 최적화된 프롬프트 전송

### API 설정:
```bash
# 기본 모델 (권장)
NEXT_PUBLIC_GROK_API_KEY=your_grok_key

# 대안 모델들
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## 보안 주의사항

⚠️ **중요**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!
- `.gitignore`에 이미 포함되어 있지만, 실수로 커밋되지 않도록 주의하세요
- API 키는 민감한 정보이므로 안전하게 보관하세요

## 사용 가능한 AI 보강 기능

### 1. 요약 (Summarize)
- 긴 스크립트를 핵심 내용만 추출하여 간결하게 요약
- 2-3문장으로 핵심 포인트 정리

### 2. 확장 (Expand)
- 짧은 스크립트를 더 자세하고 풍부하게 확장
- 배경 정보, 예시, 설명 추가

### 3. 개선 (Improve)
- 문법, 어조, 표현을 개선하여 더 자연스럽게 수정
- 완성도 높은 텍스트로 변환

### 4. 번역 (Translate)
- 다양한 언어로 번역 지원
- 원문의 의미와 뉘앙스 보존

## 사용 방법

1. YouTube URL을 입력하여 스크립트 추출
2. 추출된 스크립트 오른쪽의 AI 보강 섹션에서:
   - AI 모델 선택 (Claude, Grok, 또는 OpenAI GPT)
   - 보강 유형 선택 (요약/확장/개선/번역)
   - 보강 버튼 클릭
3. 보강된 결과 확인 및 복사

## 문제 해결

### API 키 오류
- 환경 변수가 올바르게 설정되었는지 확인
- API 키가 유효한지 확인
- 서버 재시작 후 다시 시도

### Grok API 오류
- API 키가 올바른지 확인 (xai-로 시작하는지 확인)
- 네트워크 연결 상태 확인
- 다른 AI 모델로 전환하여 사용

### CORS 오류
- Python 서버가 `http://localhost:8000`에서 실행 중인지 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인 