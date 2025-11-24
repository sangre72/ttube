#!/bin/bash

# Whisper.cpp Metal 빌드 스크립트
# Mac에서 Metal GPU 가속을 활성화하여 빌드

set -e  # 오류 발생시 중단

echo "🔧 Whisper.cpp Metal 빌드 시작..."

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/whisper.cpp"

# 기존 빌드 정리
echo "🧹 기존 빌드 정리..."
rm -rf build

# Metal 지원으로 빌드
echo "🏗️ Metal 지원으로 빌드 중..."
WHISPER_METAL=1 make -j8

# 빌드 확인
if [ -f "build/bin/whisper-cli" ]; then
    echo "✅ 빌드 성공!"
    echo "📍 실행 파일 위치: $(pwd)/build/bin/whisper-cli"
else
    echo "❌ 빌드 실패!"
    exit 1
fi

# 모델 다운로드 여부 확인
echo ""
echo "📦 모델 확인 중..."
MODEL_DIR="$(pwd)/models"

# 기본 모델 목록
MODELS=("tiny" "base" "small" "medium" "large")

for model in "${MODELS[@]}"; do
    if [ -f "$MODEL_DIR/ggml-$model.bin" ] || [ -f "$MODEL_DIR/ggml-$model.en.bin" ]; then
        echo "  ✓ $model 모델 발견"
    else
        echo "  ✗ $model 모델 없음"
    fi
done

echo ""
echo "💡 모델 다운로드 방법:"
echo "   cd $(pwd)/models"
echo "   ./download-ggml-model.sh base"
echo ""
echo "🚀 테스트 실행:"
echo "   $(pwd)/build/bin/whisper-cli -m models/ggml-base.bin -f samples/jfk.wav"