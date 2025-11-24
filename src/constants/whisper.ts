/**
 * Whisper 모델 관련 상수
 */

export const DEFAULT_WHISPER_MODEL = 'medium';

export const WHISPER_MODELS = [
  { name: 'medium', description: '높은 정확도, Metal 가속 지원 (769MB)' },
  { name: 'large', description: '최고 정확도, Metal 가속 지원 (large-v3, 1550MB)' }
] as const;

export const WHISPER_MODEL_NAMES = WHISPER_MODELS.map(model => model.name);

export type WhisperModelName = typeof WHISPER_MODEL_NAMES[number];

// API 관련 상수
export const API_ENDPOINTS = {
  TRANSCRIPTION: '/transcribe',
  HEALTH: '/health',
  MODELS: '/models'
} as const;

export const DEFAULT_API_URL = 'http://localhost:15000'; 