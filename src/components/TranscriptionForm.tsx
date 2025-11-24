import { DEFAULT_WHISPER_MODEL } from '@/constants/whisper';
import {
  CacheInfo,
  DeviceInfo,
  TranscriptionRequest,
  WhisperInfo,
  WhisperModel,
  checkServerHealth,
  clearCache,
  getAvailableModels,
  getCacheInfo,
  getServerHealth,
  isValidYouTubeUrl,
  normalizeYouTubeUrl,
  transcribeYouTubeVideo
} from '@/utils/transcriptionApi';
import {
  Delete,
  Storage,
  Close
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState, useRef } from 'react';

interface TranscriptionFormProps {
  onTranscriptionComplete?: (text: string) => void;
  initialYoutubeUrl?: string;
  initialVideoTitle?: string;
}

/**
 * YouTube 스크립트 추출 폼 컴포넌트
 */
export const TranscriptionForm: React.FC<TranscriptionFormProps> = ({
  onTranscriptionComplete,
  initialYoutubeUrl,
  initialVideoTitle
}) => {
  // 상태 관리
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_WHISPER_MODEL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [whisperInfo, setWhisperInfo] = useState<WhisperInfo | null>(null);
  const [availableModels, setAvailableModels] = useState<WhisperModel[]>([]);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [audioInfo, setAudioInfo] = useState<{
    size_mb?: number;
    duration?: number;
    download_time?: number;
    transcription_time?: number;
    from_cache?: boolean;
  }>({});
  const [progressStage, setProgressStage] = useState<'idle' | 'downloading' | 'transcribing' | 'completed' | 'error'>('idle');
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{model: string; response: string}>>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 컴포넌트 마운트 시 서버 상태 확인
  useEffect(() => {
    checkServerStatus();
  }, []);

  // ESC 키 핸들러
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showRecommendationModal) {
        // 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setShowRecommendationModal(false);
        setIsRecommending(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showRecommendationModal]);

  // initialYoutubeUrl이 변경될 때 youtubeUrl 상태 업데이트
  useEffect(() => {
    if (initialYoutubeUrl) {
      setYoutubeUrl(initialYoutubeUrl);
    }
  }, [initialYoutubeUrl]);

  // initialVideoTitle이 변경될 때 videoTitle 상태 업데이트
  useEffect(() => {
    if (initialVideoTitle) {
      setVideoTitle(initialVideoTitle);
    }
  }, [initialVideoTitle]);

  /**
   * 서버 상태 및 모델 목록 확인
   */
  const checkServerStatus = async () => {
    try {
      const health = await checkServerHealth();
      setIsServerHealthy(health);
      
      if (health) {
        // 디바이스 정보 및 Whisper 정보 가져오기
        try {
          const healthData = await getServerHealth();
          setDeviceInfo(healthData.device_info);
          setWhisperInfo(healthData.whisper);
        } catch (err) {
          console.error('서버 정보 가져오기 실패:', err);
        }
        
        const models = await getAvailableModels();
        setAvailableModels(models.models);
        
        // 캐시 정보 가져오기
        try {
          const cacheData = await getCacheInfo();
          setCacheInfo(cacheData);
        } catch (err) {
          console.error('캐시 정보 가져오기 실패:', err);
        }
      }
    } catch (err) {
      console.error('서버 상태 확인 실패:', err);
      setIsServerHealthy(false);
    }
  };

  /**
   * 캐시 삭제
   */
  const handleClearCache = async () => {
    try {
      await clearCache();
      await checkServerStatus(); // 캐시 정보 새로고침
    } catch (err: any) {
      setError(err.message || '캐시 삭제에 실패했습니다.');
    }
  };

  /**
   * 스크립트 추출 실행 (개선된 버전)
   */
  const handleTranscribe = async () => {
    if (!youtubeUrl.trim()) {
      setError('YouTube URL을 입력해주세요.');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError('유효한 YouTube URL을 입력해주세요.');
      return;
    }

    if (!isServerHealthy) {
      setError('파이썬 서버가 실행되지 않았습니다. 서버를 먼저 시작해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setTranscriptionResult('');
    setProcessingTime(0);
    setAudioInfo({});
    setProgressStage('downloading');

    try {
      const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);
      const request: TranscriptionRequest = {
        youtube_url: normalizedUrl,
        model_size: selectedModel as any
      };

      console.log('스크립트 추출 시작:', normalizedUrl);
      setProgressStage('transcribing');
      
      const result = await transcribeYouTubeVideo(request);
      
      if (result.success && result.text) {
        setTranscriptionResult(result.text);
        setProcessingTime(result.processing_time || 0);
        setAudioInfo({
          size_mb: result.audio_size_mb,
          duration: result.audio_duration,
          download_time: result.download_time,
          transcription_time: result.transcription_time,
          from_cache: result.from_cache
        });
        setProgressStage('completed');
        
        // 부모 컴포넌트에 결과 전달
        if (onTranscriptionComplete) {
          onTranscriptionComplete(result.text);
        }
        
        // 캐시 정보 새로고침
        try {
          const cacheData = await getCacheInfo();
          setCacheInfo(cacheData);
        } catch (err) {
          console.error('캐시 정보 새로고침 실패:', err);
        }
      } else {
        setError(result.error || '스크립트 추출에 실패했습니다.');
        setProgressStage('error');
      }
    } catch (err: any) {
      console.error('스크립트 추출 오류:', err);
      setError(err.message || '스크립트 추출 중 오류가 발생했습니다.');
      setProgressStage('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 제목을 기반으로 관련 콘텐츠 추천 받기 (Claude와 Grok 동시 호출)
   */
  const handleGetRecommendations = async () => {
    if (!videoTitle.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setIsRecommending(true);
    setError('');
    setRecommendations([]);
    setShowRecommendationModal(true);
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const prompt = `다음 YouTube 영상 제목을 분석하고 관련된 새로운 콘텐츠 아이디어를 추천해주세요.

제목: ${videoTitle}

다음 형식으로 5개의 관련 콘텐츠 아이디어를 제안해주세요:

1. 제목 제안
2. 주요 내용 요약 (1-2문장)
3. 타겟 시청자
4. 예상 조회수 범위
5. 차별화 포인트

각 아이디어는 원본과 연관성이 있으면서도 독창적이어야 합니다.`;

      // Claude는 Python 서버를 통해 호출
      console.log('Claude CLI 호출 시작 (Python 서버)...');
      const claudePromise = fetch('http://localhost:15000/evaluate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: prompt,
          title: videoTitle,
          evaluation_type: 'simple' 
        }),
        signal
      });

      // Grok API 호출
      console.log('Grok API 호출 시작...');
      const grokPromise = fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal
      });

      // Promise.allSettled로 모든 요청 완료 대기
      const results = await Promise.allSettled([claudePromise, grokPromise]);
      
      const newRecommendations: Array<{model: string; response: string}> = [];
      
      // Claude 응답 처리 (Python 서버)
      if (results[0].status === 'fulfilled') {
        console.log('Claude 응답 상태:', results[0].value.status);
        if (results[0].value.ok) {
          const claudeData = await results[0].value.json();
          console.log('Claude 응답 데이터:', claudeData);
          if (claudeData.success && claudeData.result) {
            newRecommendations.push({
              model: 'Claude',
              response: claudeData.result
            });
            setRecommendations(prev => [...prev, {
              model: 'Claude',
              response: claudeData.result
            }]);
          } else if (claudeData.error) {
            console.error('Claude CLI 오류:', claudeData.error);
          }
        } else {
          console.error('Claude API 오류:', results[0].value.statusText);
        }
      } else if (results[0].status === 'rejected') {
        console.error('Claude Promise 거부:', results[0].reason);
      }
      
      // Grok 응답 처리
      if (results[1].status === 'fulfilled') {
        console.log('Grok 응답 상태:', results[1].value.status);
        if (results[1].value.ok) {
          const grokData = await results[1].value.json();
          console.log('Grok 응답 데이터:', grokData);
          if (grokData.response) {
            newRecommendations.push({
              model: 'Grok',
              response: grokData.response
            });
            setRecommendations(prev => [...prev, {
              model: 'Grok',
              response: grokData.response
            }]);
          }
        } else {
          console.error('Grok API 오류:', results[1].value.statusText);
        }
      } else if (results[1].status === 'rejected') {
        console.error('Grok Promise 거부:', results[1].reason);
      }
      
      // 둘 다 실패한 경우 에러 표시
      if (newRecommendations.length === 0) {
        throw new Error('모든 AI 모델에서 응답을 받지 못했습니다.');
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
      } else {
        console.error('추천 요청 오류:', err);
        setError(err.message || '추천을 받는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsRecommending(false);
      setShowRecommendationModal(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
          🎤 YouTube 스크립트 추출
        </Typography>

        {/* 서버 상태 표시 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={isServerHealthy ? '✅ 서버 연결됨' : '❌ 서버 연결 안됨'}
              color={isServerHealthy ? 'success' : 'error'}
              size="small"
            />
            {deviceInfo && (
              <Chip
                label={`${deviceInfo.gpu_available ? '🚀' : '💻'} ${deviceInfo.device.toUpperCase()}`}
                color={deviceInfo.gpu_available ? 'primary' : 'default'}
                size="small"
                variant="outlined"
              />
            )}
            {cacheInfo && (
              <Chip
                label={`💾 캐시: ${cacheInfo.valid_files}개 (${cacheInfo.total_size_mb}MB)`}
                color="info"
                size="small"
                variant="outlined"
                icon={<Storage />}
              />
            )}
          </Box>
          {deviceInfo?.gpu_available && deviceInfo.gpu_name && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              GPU: {deviceInfo.gpu_name}
            </Typography>
          )}
          
          {/* Whisper 정보 표시 */}
          {whisperInfo && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`💻 ${whisperInfo.mode} 모드`}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {whisperInfo.message}
              </Typography>
            </Box>
          )}
          
          {/* 캐시 관리 */}
          {cacheInfo && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                캐시 보관: {cacheInfo.retention_hours}시간 | 
                만료된 파일: {cacheInfo.expired_files}개
              </Typography>
              <Tooltip title="모든 캐시 삭제">
                <IconButton size="small" onClick={handleClearCache} color="error">
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {!isServerHealthy && (
            <Typography variant="caption" color="text.secondary">
              파이썬 서버를 먼저 시작해주세요 (python-server/run_server.py)
            </Typography>
          )}
        </Box>

        {/* YouTube URL 입력 */}
        <TextField
          fullWidth
          label="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          disabled={isLoading || !isServerHealthy}
        />

        {/* 영상 제목 입력 */}
        <TextField
          fullWidth
          label="영상 제목 (관련 콘텐츠 추천용)"
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isRecommending) {
              e.preventDefault();
              handleGetRecommendations();
            }
          }}
          placeholder="영상 제목을 입력하고 Enter를 눌러 관련 콘텐츠를 추천받으세요"
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
          disabled={isRecommending}
        />

        {/* 모델 선택 */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Whisper 모델</InputLabel>
          <Select
            value={selectedModel}
            label="Whisper 모델"
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading || !isServerHealthy}
          >
            {availableModels.map((model) => (
              <MenuItem key={model.name} value={model.name}>
                {model.name} - {model.description}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 추출 버튼 */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleTranscribe}
          disabled={isLoading || !isServerHealthy || !youtubeUrl.trim()}
          sx={{ mb: 2 }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {progressStage === 'downloading' ? '오디오 다운로드 중...' : 
               progressStage === 'transcribing' ? '음성 인식 중...' : 
               '스크립트 추출 중...'}
            </>
          ) : (
            '🎬 스크립트 추출 시작'
          )}
        </Button>

        {/* 추천 로딩 상태 */}
        {isRecommending && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" component="span">
              Claude와 Grok에게 관련 콘텐츠 추천 요청 중...
            </Typography>
          </Box>
        )}

        {/* 진행 상황 표시 */}
        {isLoading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="indeterminate" 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {progressStage === 'downloading' ? '📥 YouTube에서 오디오 다운로드 중...' :
               progressStage === 'transcribing' ? '🎤 Whisper로 음성 인식 중...' :
               '처리 중...'}
            </Typography>
          </Box>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 처리 정보 표시 */}
        {processingTime > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip
                label={`총 처리 시간: ${processingTime.toFixed(1)}초`}
                color="info"
                size="small"
              />
              {audioInfo.download_time && (
                <Chip
                  label={`다운로드: ${audioInfo.download_time.toFixed(1)}초`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
              {audioInfo.transcription_time && (
                <Chip
                  label={`음성 인식: ${audioInfo.transcription_time.toFixed(1)}초`}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )}
              {audioInfo.from_cache && (
                <Chip
                  label="캐시에서 로드"
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            
            {/* 파일 정보 */}
            {(audioInfo.size_mb || audioInfo.duration) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {audioInfo.size_mb && (
                  <Chip
                    label={`파일 크기: ${audioInfo.size_mb.toFixed(2)}MB`}
                    color="default"
                    size="small"
                    variant="outlined"
                  />
                )}
                {audioInfo.duration && (
                  <Chip
                    label={`영상 길이: ${Math.floor(audioInfo.duration / 60)}분 ${Math.floor(audioInfo.duration % 60)}초`}
                    color="default"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Box>
        )}

        {/* 추출 결과 */}
        {transcriptionResult && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              📝 추출된 스크립트
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
                maxHeight: '300px',
                overflow: 'auto'
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {transcriptionResult}
              </Typography>
            </Box>
          </>
        )}

        {/* 추천 결과 */}
        {recommendations.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              💡 관련 콘텐츠 추천
            </Typography>
            {recommendations.map((rec, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Chip 
                  label={`${rec.model} 응답`} 
                  color={rec.model === 'Claude' ? 'primary' : 'secondary'}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box
                  sx={{
                    p: 2,
                    bgcolor: rec.model === 'Claude' ? 'blue.50' : 'purple.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: rec.model === 'Claude' ? 'blue.200' : 'purple.200',
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {rec.response}
                  </Typography>
                </Box>
              </Box>
            ))}
          </>
        )}
      </CardContent>
      
      {/* 추천 진행 모달 */}
      <Modal
        open={showRecommendationModal}
        onClose={(event, reason) => {
          // backdropClick이나 다른 이유로는 닫히지 않도록 함
          if (reason === 'escapeKeyDown') {
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
            }
            setShowRecommendationModal(false);
            setIsRecommending(false);
          }
        }}
        aria-labelledby="recommendation-modal-title"
        disableEscapeKeyDown={false}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          textAlign: 'center'
        }}>
          {/* X 버튼 제거 - ESC 키로만 닫을 수 있도록 */}
          <Typography id="recommendation-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            AI 추천 진행 중
          </Typography>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            Claude와 Grok에게 관련 콘텐츠 추천을 요청하고 있습니다...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ESC 키를 눌러 취소할 수 있습니다
          </Typography>
        </Box>
      </Modal>
    </Card>
  );
}; 