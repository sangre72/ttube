"""
파일 캐시 관리 모듈
다운로드한 오디오 파일을 지정된 기간만큼 보관하여 중복 다운로드 방지
"""

import os
import hashlib
import json
import time
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from constants import CACHE_DIR, CACHE_RETENTION_HOURS, CACHE_CLEANUP_INTERVAL

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.cache_dir = Path(CACHE_DIR)
        self.metadata_file = self.cache_dir / "metadata.json"
        self.last_cleanup = 0
        
        # 캐시 디렉토리 생성
        self.cache_dir.mkdir(exist_ok=True)
        
        # 메타데이터 로드
        self.metadata = self._load_metadata()
        
        # 주기적 정리 실행
        self._cleanup_if_needed()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """메타데이터 파일 로드"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"메타데이터 로드 실패: {e}")
                return {}
        return {}
    
    def _save_metadata(self):
        """메타데이터 파일 저장"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"메타데이터 저장 실패: {e}")
    
    def _generate_cache_key(self, youtube_url: str) -> str:
        """YouTube URL로부터 캐시 키 생성"""
        return hashlib.md5(youtube_url.encode()).hexdigest()
    
    def _cleanup_if_needed(self):
        """필요시 캐시 정리 실행"""
        current_time = time.time()
        if current_time - self.last_cleanup > CACHE_CLEANUP_INTERVAL:
            self.cleanup_expired_files()
            self.last_cleanup = current_time
    
    def get_cached_file(self, youtube_url: str) -> Optional[str]:
        """
        캐시된 파일 경로 반환
        
        Args:
            youtube_url: YouTube URL
            
        Returns:
            캐시된 파일 경로 또는 None
        """
        cache_key = self._generate_cache_key(youtube_url)
        
        if cache_key in self.metadata:
            cache_info = self.metadata[cache_key]
            file_path = self.cache_dir / f"{cache_key}.mp3"
            
            # 파일이 존재하고 만료되지 않았는지 확인
            if file_path.exists():
                current_time = time.time()
                if current_time - cache_info['created_at'] < CACHE_RETENTION_HOURS * 3600:
                    logger.info(f"캐시된 파일 사용: {youtube_url}")
                    return str(file_path)
                else:
                    logger.info(f"캐시 만료: {youtube_url}")
                    self._remove_cache_entry(cache_key)
        
        return None
    
    def cache_file(self, youtube_url: str, file_path: str, duration: Optional[float] = None) -> str:
        """
        파일을 캐시에 저장
        
        Args:
            youtube_url: YouTube URL
            file_path: 원본 파일 경로
            duration: 영상 길이 (초)
            
        Returns:
            캐시된 파일 경로
        """
        cache_key = self._generate_cache_key(youtube_url)
        cache_file_path = self.cache_dir / f"{cache_key}.mp3"
        
        try:
            # 파일 복사
            shutil.copy2(file_path, cache_file_path)
            
            # 파일 크기 계산
            file_size = os.path.getsize(cache_file_path)
            file_size_mb = file_size / (1024 * 1024)
            
            # 메타데이터 저장
            self.metadata[cache_key] = {
                'youtube_url': youtube_url,
                'created_at': time.time(),
                'file_size_mb': file_size_mb,
                'duration': duration,
                'original_path': file_path
            }
            
            self._save_metadata()
            
            logger.info(f"파일 캐시됨: {youtube_url} ({file_size_mb:.2f}MB)")
            return str(cache_file_path)
            
        except Exception as e:
            logger.error(f"파일 캐시 실패: {e}")
            # 캐시 실패 시 원본 파일 경로 반환
            return file_path
    
    def _remove_cache_entry(self, cache_key: str):
        """캐시 엔트리 제거"""
        try:
            # 파일 삭제
            cache_file_path = self.cache_dir / f"{cache_key}.mp3"
            if cache_file_path.exists():
                cache_file_path.unlink()
            
            # 메타데이터에서 제거
            if cache_key in self.metadata:
                del self.metadata[cache_key]
                self._save_metadata()
                
            logger.info(f"캐시 엔트리 제거됨: {cache_key}")
            
        except Exception as e:
            logger.error(f"캐시 엔트리 제거 실패: {e}")
    
    def cleanup_expired_files(self):
        """만료된 파일들 정리"""
        current_time = time.time()
        expired_keys = []
        
        for cache_key, cache_info in self.metadata.items():
            if current_time - cache_info['created_at'] > CACHE_RETENTION_HOURS * 3600:
                expired_keys.append(cache_key)
        
        for cache_key in expired_keys:
            self._remove_cache_entry(cache_key)
        
        if expired_keys:
            logger.info(f"만료된 캐시 파일 {len(expired_keys)}개 정리됨")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """캐시 정보 반환"""
        current_time = time.time()
        total_size = 0
        valid_files = 0
        expired_files = 0
        
        for cache_info in self.metadata.values():
            if current_time - cache_info['created_at'] < CACHE_RETENTION_HOURS * 3600:
                total_size += cache_info.get('file_size_mb', 0)
                valid_files += 1
            else:
                expired_files += 1
        
        return {
            'total_files': len(self.metadata),
            'valid_files': valid_files,
            'expired_files': expired_files,
            'total_size_mb': round(total_size, 2),
            'retention_hours': CACHE_RETENTION_HOURS,
            'cache_dir': str(self.cache_dir)
        }
    
    def clear_all_cache(self):
        """모든 캐시 삭제"""
        try:
            # 모든 파일 삭제
            for file_path in self.cache_dir.glob("*.mp3"):
                file_path.unlink()
            
            # 메타데이터 파일 삭제
            if self.metadata_file.exists():
                self.metadata_file.unlink()
            
            # 메타데이터 초기화
            self.metadata = {}
            
            logger.info("모든 캐시 삭제됨")
            
        except Exception as e:
            logger.error(f"캐시 삭제 실패: {e}")

# 전역 캐시 매니저 인스턴스
cache_manager = CacheManager() 