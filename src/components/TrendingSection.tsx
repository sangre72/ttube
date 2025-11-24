import { Category, Video } from '@/store/youtubeStore';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  List,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import React from 'react';
import { TrendingItem } from './TrendingItem';

interface TrendingSectionProps {
  trendingVideos: Video[];
  categories: Category[];
  availableCategories: Category[];
  selectedCategory: string;
  isTrendingLoading: boolean;
  isCategoriesLoading: boolean;
  isTestingCategories: boolean;
  onCategoryChange: (categoryId: string) => void;
  onExtractScript?: (youtubeUrl: string, videoTitle?: string, videoCategory?: string) => void;
}

/**
 * 트렌드 섹션 컴포넌트
 * 좌측에 표시되는 트렌드 순위 목록
 */
export const TrendingSection: React.FC<TrendingSectionProps> = ({
  trendingVideos,
  categories,
  availableCategories,
  selectedCategory,
  isTrendingLoading,
  isCategoriesLoading,
  isTestingCategories,
  onCategoryChange,
  onExtractScript
}) => {
  // 사용 가능한 카테고리만 필터링
  const usableCategories = availableCategories.filter(cat => cat.id !== '0');

  return (
    <div className="col-12 col-lg-3">
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#d32f2f' }}>
            🔥 한국 트렌드 순위
          </Typography>
          
          {/* 카테고리 선택 */}
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>분야 선택</InputLabel>
              <Select
                value={selectedCategory}
                label="분야 선택"
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={isCategoriesLoading || isTestingCategories}
              >
                <MenuItem value="0">전체</MenuItem>
                
                {/* 사용 가능한 카테고리들 */}
                {usableCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.snippet.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 카테고리 테스트 상태 표시 */}
            {isTestingCategories && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  카테고리 확인 중...
                </Typography>
              </Box>
            )}
            
            {/* 사용 가능한 카테고리 개수 표시 */}
            {!isTestingCategories && availableCategories.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={`사용 가능한 분야: ${usableCategories.length}개`} 
                  size="small" 
                  variant="outlined"
                  color="success"
                />
              </Box>
            )}
          </Box>
          
          {isTrendingLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : trendingVideos.length > 0 ? (
            <List sx={{ py: 0 }}>
              {trendingVideos.map((video, index) => (
                <React.Fragment key={video.id}>
                  <TrendingItem 
                    video={video} 
                    rank={index + 1} 
                    onExtractScript={onExtractScript}
                    categoryName={categories.find(cat => cat.id === selectedCategory)?.snippet.title}
                  />
                  {index < trendingVideos.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              트렌드 데이터를 불러올 수 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 