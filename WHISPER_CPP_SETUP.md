# Whisper.cpp 설치 및 설정 가이드

## 개요

Whisper.cpp는 Apple Silicon Mac에서 Metal을 통한 최적화된 성능을 제공하는 C++ 구현체입니다. 
기존 OpenAI Whisper 대비 최대 3배 빠른 처리 속도를 제공합니다.

## 설치 방법

### 1. 의존성 설치

```bash
# Homebrew로 필요한 도구 설치
brew install cmake
brew install git

# Python 패키지 설치 (이미 설치되어 있음)
pip install openai-whisper
```

### 2. Whisper.cpp 다운로드 및 빌드

```bash
# 프로젝트 루트에서 실행
cd python-server

# Whisper.cpp 저장소 클론
git clone https://github.com/ggml-org/whisper.cpp.git
cd whisper.cpp

# Metal 지원으로 빌드
cmake -B build -DGGML_METAL=1
cmake --build build -j --config Release

# 상위 디렉토리로 돌아가기
cd ..
```

### 3. 모델 다운로드 (자동 감지 지원)

```bash
# 기본 모델들 다운로드
./models/download-ggml-model.sh base.en
./models/download-ggml-model.sh medium.en

# 추가 모델들 (선택사항)
./models/download-ggml-model.sh small.en
./models/download-ggml-model.sh large-v3
```

**💡 자동 모델 감지 기능**: 시스템이 자동으로 다운로드된 모델을 감지하고 최적의 모델을 선택합니다.

### 3. 설정 확인

`python-server/constants.py` 파일에서 다음 설정을 확인하세요:

```python
# Whisper.cpp 설정 (Apple Silicon 최적화)
USE_WHISPER_CPP = True  # whisper.cpp 사용 여부
WHISPER_CPP_PATH = "./whisper.cpp"  # whisper.cpp 설치 경로
WHISPER_CPP_MODELS_PATH = "./whisper.cpp/models"  # 모델 경로
```

## 사용 가능한 모델

### 다운로드 가능한 모델:

```bash
# 기본 모델들
./models/download-ggml-model.sh tiny.en
./models/download-ggml-model.sh base.en
./models/download-ggml-model.sh small.en
./models/download-ggml-model.sh medium.en
./models/download-ggml-model.sh large-v3

# 다국어 모델들
./models/download-ggml-model.sh base
./models/download-ggml-model.sh medium
./models/download-ggml-model.sh large-v3
```

### 모델 크기 비교:

| 모델 | 크기 | 속도 | 정확도 |
|------|------|------|--------|
| tiny.en | 39MB | 매우 빠름 | 낮음 |
| base.en | 74MB | 빠름 | 보통 |
| small.en | 244MB | 보통 | 좋음 |
| medium.en | 769MB | 느림 | 높음 |
| large-v3 | 1550MB | 매우 느림 | 최고 |

## 자동 모델 감지 기능

### 🎯 스마트 모델 선택

시스템이 자동으로 다운로드된 모델을 감지하고 최적의 모델을 선택합니다:

1. **정확한 일치**: 요청된 모델이 정확히 존재하는 경우
2. **유사 모델**: 같은 기본 모델의 다른 버전 (예: `medium.en` → `medium`)
3. **최고 품질**: 사용 가능한 모델 중 최고 품질 모델
4. **폴백**: 마지막 수단으로 첫 번째 사용 가능한 모델

### 📊 모델 품질 순서

```
large-v3 > large > medium > medium.en > small > small.en > base > base.en > tiny > tiny.en
```

### 🔍 로그에서 확인

서버 실행 시 다음과 같은 로그를 확인할 수 있습니다:

```
INFO:whisper_cpp_utils:발견된 모델: base.en (ggml-base.en.bin)
INFO:whisper_cpp_utils:발견된 모델: medium.en (ggml-medium.en.bin)
INFO:whisper_cpp_utils:정확히 일치하는 모델 사용: medium.en
```

## 성능 비교

### Apple Silicon Mac에서의 성능:

| 방법 | 처리 속도 | 메모리 사용량 | 안정성 |
|------|-----------|---------------|--------|
| **Whisper.cpp (Metal)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI Whisper (CPU) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI Whisper (MPS) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

### 실제 성능 테스트:

- **Whisper.cpp (Metal)**: 1분 오디오 → 약 3-5초
- **OpenAI Whisper (CPU)**: 1분 오디오 → 약 15-20초
- **OpenAI Whisper (MPS)**: 1분 오디오 → 약 8-12초 (안정성 문제)

## 문제 해결

### 1. 빌드 오류

```bash
# CMake 캐시 삭제 후 재빌드
rm -rf build
cmake -B build -DGGML_METAL=1
cmake --build build -j --config Release
```

### 2. Metal 지원 확인

```bash
# Metal 지원 확인
./build/bin/whisper-cli --help | grep metal
```

### 3. 모델 다운로드 실패

```bash
# 수동으로 모델 다운로드
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin -O models/ggml-base.en.bin
```

### 4. 권한 문제

```bash
# 실행 권한 부여
chmod +x models/download-ggml-model.sh
chmod +x build/bin/whisper-cli
```

## 고급 설정

### 1. 언어별 최적화

```python
# 한국어 오디오의 경우
language = "ko"  # 한국어 지정

# 영어 오디오의 경우  
language = "en"  # 영어 지정

# 자동 감지
language = "auto"  # 자동 언어 감지
```

### 2. 출력 형식 설정

```python
# 텍스트만 출력
output_format = "txt"

# JSON 형식 (세그먼트 정보 포함)
output_format = "json"

# 자막 형식
output_format = "srt"
```

## 로그 확인

서버 실행 시 다음과 같은 로그를 확인할 수 있습니다:

```
INFO:whisper_cpp_utils:Whisper.cpp 사용 가능
INFO:whisper_cpp_utils:발견된 모델: base.en (ggml-base.en.bin)
INFO:whisper_cpp_utils:발견된 모델: medium.en (ggml-medium.en.bin)
INFO:main:Whisper.cpp 사용하여 Metal 최적화 모드로 실행
INFO:main:사용 가능한 Whisper.cpp 모델: ['base.en', 'medium.en']
INFO:main:요청된 모델: medium -> 변환된 모델: medium.en
INFO:whisper_cpp_utils:정확히 일치하는 모델 사용: medium.en
INFO:whisper_cpp_utils:Whisper.cpp 변환 완료: 150 문자
INFO:main:Whisper.cpp 음성 인식 완료: 150 문자 -> 150 문자 (Metal 최적화)
```

## 주의사항

1. **첫 실행 시 지연**: 모델 다운로드로 인해 첫 실행 시 시간이 걸릴 수 있습니다.
2. **메모리 사용량**: large 모델 사용 시 충분한 메모리가 필요합니다.
3. **오디오 형식**: WAV, MP3, M4A 등 다양한 형식을 지원합니다.
4. **폴백 시스템**: Whisper.cpp 실패 시 자동으로 OpenAI Whisper로 전환됩니다. 