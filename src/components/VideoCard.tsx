import { Video } from '@/store/youtubeStore';
import { formatDate, formatViewCount } from '@/utils/formatters';
import { Mic } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Link,
  Typography
} from '@mui/material';
import React from 'react';

/**
 * ISO 8601 duration을 사람이 읽을 수 있는 형식으로 변환
 * @param duration ISO 8601 duration string (e.g., "PT4M13S", "PT1H2M10S")
 * @returns 포맷된 시간 문자열 (e.g., "4:13", "1:02:10")
 */
function formatDuration(duration?: string): string {
  if (!duration) return '0:00';
  
  // PT로 시작하는 ISO 8601 형식 파싱
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

interface VideoCardProps {
  video: Video;
  onExtractScript?: (youtubeUrl: string, videoTitle?: string, videoCategory?: string) => void;
}

/**
 * 비디오 카드 컴포넌트
 * 검색 결과의 각 비디오를 카드 형태로 표시
 */
export const VideoCard: React.FC<VideoCardProps> = ({ video, onExtractScript }) => (
  <div className="col-12 mb-3">
    <Card sx={{ 
      display: 'flex', 
      flexDirection: 'row', 
      height: 'auto',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        transform: 'translateY(-2px)',
        transition: 'all 0.3s ease'
      }
    }}>
      {/* 썸네일 */}
      <Box sx={{ 
        width: 168, 
        height: 94, 
        flexShrink: 0,
        position: 'relative'
      }}>
        <CardMedia
          component="img"
          image={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />
        {/* 재생 시간 오버레이 (실제로는 API에서 제공하지 않으므로 예시) */}
        <Box sx={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          bgcolor: 'rgba(0,0,0,0.8)',
          color: 'white',
          px: 0.5,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {formatDuration(video.contentDetails?.duration)}
        </Box>
      </Box>
      
      {/* 상세 정보 */}
      <CardContent sx={{ 
        flex: 1, 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <Box>
          {/* 제목 */}
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.4,
              mb: 1,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              '&:hover': {
                color: '#1976d2'
              }
            }}
          >
            <Link 
              href={`https://www.youtube.com/watch?v=${video.id}`} 
              target="_blank" 
              rel="noopener" 
              underline="none"
              sx={{ color: 'inherit' }}
            >
              {video.snippet.title}
            </Link>
          </Typography>
          
          {/* 채널명 */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            {video.snippet.channelTitle}
          </Typography>
          
          {/* 조회수 및 업로드일 */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            조회수 {formatViewCount(video.statistics.viewCount)}회 • {formatDate(video.snippet.publishedAt)}
          </Typography>
        </Box>
        
        {/* 추가 정보 (좋아요 수, 관련성 점수 등) */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`👍 ${formatViewCount(video.statistics.likeCount)}`} 
            variant="outlined" 
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
          <Chip 
            label={`💬 ${formatViewCount(video.statistics.commentCount)}`} 
            variant="outlined" 
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
          {/* 관련성 점수 표시 */}
          {video.relevanceScore !== undefined && (
            <Chip 
              label={`관련성: ${video.relevanceScore}점`} 
              variant="outlined" 
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                bgcolor: video.relevanceScore > 15 ? '#e8f5e8' : video.relevanceScore > 10 ? '#fff3e0' : '#ffebee',
                color: video.relevanceScore > 15 ? '#2e7d32' : video.relevanceScore > 10 ? '#f57c00' : '#c62828'
              }}
            />
          )}
          
          {/* 스크립트 추출 버튼 */}
          {onExtractScript && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Mic />}
              onClick={() => onExtractScript(
                `https://www.youtube.com/watch?v=${video.id}`,
                video.snippet.title,
                video.snippet.categoryId
              )}
              sx={{
                ml: 'auto',
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0'
                }
              }}
            >
              스크립트 추출
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  </div>
); 