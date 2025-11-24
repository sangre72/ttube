#!/usr/bin/env python3
"""
YouTube 스크립트 추출 서버 실행 스크립트
"""

import uvicorn
from main import app


def main():
    """서버 실행 메인 함수"""
    print("🎬 YouTube 스크립트 추출 서버를 시작합니다...")
    print("📡 서버 주소: http://localhost:15000")
    print("📚 API 문서: http://localhost:15000/docs")
    print("🔧 서버 상태: http://localhost:15000/health")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",  # import string으로 변경
        host="0.0.0.0", 
        port=15000,
        reload=True,  # 개발 모드에서 코드 변경 시 자동 재시작
        log_level="info"
    )


if __name__ == "__main__":
    main() 