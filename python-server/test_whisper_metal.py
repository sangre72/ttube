#!/usr/bin/env python3
"""
Whisper.cpp Metal 테스트 스크립트
"""

import os
import sys

def test_whisper_cpp_metal():
    print("🧪 Whisper.cpp Metal 테스트 시작...")
    
    try:
        from whisper_cpp_metal import WhisperCppMetal
        print("✅ whisper_cpp_metal 모듈 임포트 성공")
        
        # 초기화 테스트
        whisper = WhisperCppMetal(model_size="base")
        print("✅ WhisperCppMetal 초기화 성공")
        print(f"   - 모델 경로: {whisper.model_path}")
        print(f"   - 실행 파일: {whisper.whisper_cli}")
        
        # 사용 가능한 모델 확인
        models = whisper.get_available_models()
        print(f"✅ 사용 가능한 모델: {len(models)}개")
        for model in models:
            print(f"   - {model['name']}: {model['size']:.1f} MB")
        
        # 테스트 오디오 파일 확인
        test_audio = os.path.join(whisper.base_dir, "samples", "jfk.wav")
        if os.path.exists(test_audio):
            print(f"✅ 테스트 오디오 파일 발견: {test_audio}")
            
            # 실제 변환 테스트
            print("🎵 음성 인식 테스트 중...")
            result = whisper.transcribe(test_audio, language="en")
            
            if result["success"]:
                print("✅ 음성 인식 성공!")
                print(f"   결과: {result['text'][:100]}...")
                print(f"   언어: {result.get('language', 'unknown')}")
                if 'processing_time' in result:
                    print(f"   처리 시간: {result['processing_time']:.2f}s")
            else:
                print(f"❌ 음성 인식 실패: {result.get('error', 'Unknown error')}")
        else:
            print(f"⚠️ 테스트 오디오 파일이 없습니다: {test_audio}")
            
    except ImportError as e:
        print(f"❌ 모듈 임포트 실패: {e}")
        return False
    except FileNotFoundError as e:
        print(f"❌ 파일 찾기 실패: {e}")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False
    
    print("🎉 Whisper.cpp Metal 테스트 완료!")
    return True

if __name__ == "__main__":
    success = test_whisper_cpp_metal()
    sys.exit(0 if success else 1)