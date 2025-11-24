import { Video } from '@/store/youtubeStore';
import { formatViewCount } from '@/utils/formatters';
import { Mic } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Link,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography
} from '@mui/material';
import React from 'react';

interface TrendingItemProps {
  video: Video;
  rank: number;
  onExtractScript?: (youtubeUrl: string, videoTitle?: string, videoCategory?: string) => void;
  categoryName?: string;
}

/**
 * 트렌드 순위 아이템 컴포넌트
 * 각 트렌드 비디오를 순위와 함께 표시
 */
export const TrendingItem: React.FC<TrendingItemProps> = ({ video, rank, onExtractScript, categoryName }) => (
  <ListItem 
    sx={{ 
      px: 1, 
      py: 0.5,
      '&:hover': {
        bgcolor: 'grey.50',
        borderRadius: 1
      }
    }}
  >
    <ListItemAvatar sx={{ minWidth: 40 }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar 
          src={video.snippet.thumbnails.default.url} 
          variant="rounded"
          sx={{ width: 60, height: 34 }}
        />
        <Box sx={{
          position: 'absolute',
          top: -10,
          left: -5,
          bgcolor: rank <= 3 ? '#ff4444' : '#666',
          color: 'white',
          width: 20,
          height: 20,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {rank}
        </Box>
      </Box>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Link 
          href={`https://www.youtube.com/watch?v=${video.id}`} 
          target="_blank" 
          rel="noopener"
          underline="none"
          title={video.snippet.title}
          sx={{ 
            color: 'inherit',
            fontSize: '0.875rem',
            fontWeight: rank <= 3 ? 600 : 400,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
            maxWidth: '100%',
            wordBreak: 'break-word',
            '&:hover': {
              color: '#1976d2'
            }
          }}
        >
          {video.snippet.title}
        </Link>
      }
      secondary={
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {video.snippet.channelTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              조회수 {formatViewCount(video.statistics.viewCount)}회
            </Typography>
            {onExtractScript && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Mic />}
                onClick={() => onExtractScript(
                  `https://www.youtube.com/watch?v=${video.id}`,
                  video.snippet.title,
                  categoryName
                )}
                sx={{
                  fontSize: '0.7rem',
                  py: 0.25,
                  px: 1,
                  minWidth: 'auto',
                  height: '20px'
                }}
              >
                추출
              </Button>
            )}
          </Box>
        </Box>
      }
    />
  </ListItem>
); 