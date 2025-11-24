/**
 * YouTube 스크립트 추출 API 클라이언트
 * 파이썬 서버와 통신하여 음성을 텍스트로 변환
 */

import { API_ENDPOINTS, DEFAULT_API_URL, type WhisperModelName } from '@/constants/whisper';

// API 서버 기본 URL
const API_BASE_URL = DEFAULT_API_URL;

// 요청 타입 정의
export interface TranscriptionRequest {
  youtube_url: string;
  model_size?: WhisperModelName;
}

// 응답 타입 정의
export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  error?: string;
  processing_time?: number;
  audio_size_mb?: number;
  audio_duration?: number;
  download_time?: number;
  transcription_time?: number;
  from_cache?: boolean;
}

export interface CacheInfo {
  total_files: number;
  valid_files: number;
  expired_files: number;
  total_size_mb: number;
  retention_hours: number;
  cache_dir: string;
}

// 사용 가능한 모델 타입
export interface WhisperModel {
  name: string;
  description: string;
}

export interface ModelsResponse {
  models: WhisperModel[];
  loaded_models: string[];
}

export interface DeviceInfo {
  device: string;
  gpu_available: boolean;
  gpu_name?: string;
  memory_info?: {
    total: number;
    allocated: number;
    cached: number;
  };
}

export interface WhisperInfo {
  mode: string;
  whisper_cpp: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  device_info: DeviceInfo;
  whisper: WhisperInfo;
}

/**
 * 서버 상태 확인
 */
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`);
    return response.ok;
  } catch (error) {
    console.error('서버 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 서버 상태 및 디바이스 정보 확인
 */
export const getServerHealth = async (): Promise<HealthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`);
    if (!response.ok) {
      throw new Error('서버 상태 확인 실패');
    }
    return await response.json();
  } catch (error) {
    console.error('서버 상태 확인 실패:', error);
    throw error;
  }
};

/**
 * 사용 가능한 Whisper 모델 목록 가져오기
 */
export const getAvailableModels = async (): Promise<ModelsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MODELS}`);
    if (!response.ok) {
      throw new Error('모델 목록을 가져올 수 없습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('모델 목록 가져오기 실패:', error);
    throw error;
  }
};

/**
 * YouTube 영상 스크립트 추출
 * @param request YouTube URL과 모델 크기
 * @returns 변환된 텍스트
 */
export const transcribeYouTubeVideo = async (
  request: TranscriptionRequest
): Promise<TranscriptionResponse> => {
  try {
    console.log('스크립트 추출 시작:', request.youtube_url);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TRANSCRIPTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('스크립트 추출 완료:', {
      success: result.success,
      textLength: result.text?.length || 0,
      processingTime: result.processing_time
    });
    
    return result;
  } catch (error) {
    console.error('스크립트 추출 실패:', error);
    throw error;
  }
};

/**
 * YouTube URL 유효성 검사
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

/**
 * YouTube URL 정규화
 */
export const normalizeYouTubeUrl = (url: string): string => {
  // youtu.be 링크를 youtube.com 링크로 변환
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
};

/**
 * 캐시 정보 가져오기
 */
export const getCacheInfo = async (): Promise<CacheInfo> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cache/info`);
    if (!response.ok) {
      throw new Error('캐시 정보를 가져올 수 없습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('캐시 정보 가져오기 실패:', error);
    throw error;
  }
};

/**
 * 모든 캐시 삭제
 */
export const clearCache = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cache/clear`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('캐시 삭제에 실패했습니다');
    }
  } catch (error) {
    console.error('캐시 삭제 실패:', error);
    throw error;
  }
}; 