import { Video } from '@/store/youtubeStore';
import {
    Box,
    Typography
} from '@mui/material';
import React from 'react';
import { VideoCard } from './VideoCard';

interface SearchResultsSectionProps {
  videos: Video[];
  searchQuery: string;
  minViewCount: number;
  onExtractScript?: (youtubeUrl: string, videoTitle?: string, videoCategory?: string) => void;
}

/**
 * 검색 결과 섹션 컴포넌트
 * 우측에 표시되는 검색 결과 목록
 */
export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  videos,
  searchQuery,
  minViewCount,
  onExtractScript
}) => (
  <div className="col-12 col-lg-9">
    {/* 검색 결과 개수 및 필터링 정보 표시 */}
    {videos.length > 0 && (
      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
          검색 결과: {videos.length}개
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 검색어: "{searchQuery}" | 최소 조회수: {minViewCount.toLocaleString()}회
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 관련성 점수 기준으로 정렬 (높은 점수 우선)
        </Typography>
      </Box>
    )}

    <div className="row">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onExtractScript={onExtractScript} />
      ))}
    </div>
  </div>
); 