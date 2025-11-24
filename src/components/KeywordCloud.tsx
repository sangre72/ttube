import { KeywordData, getKeywordTrends, transformKeywordDataForCloud } from '@/utils/naverDatalabApi';
import { Search } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, CircularProgress, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactWordcloud from 'react-wordcloud';

interface KeywordCloudProps {
  keywords?: KeywordData[];
  searchQuery?: string;
  onKeywordSelect?: (keyword: string) => void;
}

/**
 * 키워드 텍스트 클라우드 컴포넌트
 * 네이버 데이터랩 데이터를 시각적으로 표시
 */
export const KeywordCloud: React.FC<KeywordCloudProps> = ({ keywords: propKeywords, searchQuery: propSearchQuery, onKeywordSelect }) => {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadKeywordData();
  }, []);

  // 검색어 변경 시 데이터 다시 로드
  useEffect(() => {
    if (propSearchQuery !== searchQuery) {
      setSearchQuery(propSearchQuery || '');
    }
  }, [propSearchQuery]);

  const loadKeywordData = async (query?: string) => {
    setIsLoading(true);
    try {
      console.log('키워드 데이터 로드 시작:', query);
      const data = await getKeywordTrends(query);
      console.log('받은 키워드 데이터:', data);
      setKeywords(data);
    } catch (error) {
      console.error('키워드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadKeywordData(searchQuery);
  };

  const handleKeywordClick = (word: any) => {
    console.log('클릭된 워드:', word);
    const keyword = keywords.find(k => k.text === word.text);
    if (keyword) {
      setSelectedKeyword(keyword);
      console.log('선택된 키워드:', keyword);
      console.log('onKeywordSelect 함수 존재 여부:', !!onKeywordSelect);
      // 키워드를 검색어에 자동으로 입력
      if (onKeywordSelect) {
        console.log('키워드 전달:', keyword.text);
        onKeywordSelect(keyword.text);
      }
    }
  };

  const wordData = transformKeywordDataForCloud(keywords);

  const options = {
    rotations: 0, // 회전 없음 (가로 텍스트)
    rotationAngles: [0, 0] as [number, number], // 0도로 고정
    fontSizes: [16, 80] as [number, number], // 폰트 크기 범위 확대
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 'bold',
    padding: 3, // 단어 간격 약간 증가
    scale: 'linear', // 선형 스케일 사용
    spiral: 'rectangular', // 직사각형 나선형으로 배치
    deterministic: true,
    colors: [
      '#1976d2', // 파란색
      '#d32f2f', // 빨간색
      '#388e3c', // 초록색
      '#f57c00', // 주황색
      '#7b1fa2', // 보라색
      '#c2185b', // 분홍색
      '#303f9f', // 진한 파란색
      '#d84315', // 진한 주황색
      '#388e3c', // 진한 초록색
      '#6a1b9a'  // 진한 보라색
    ]
  };

  const callbacks = {
    onWordClick: (word: any, event?: any) => {
      console.log('onWordClick 호출됨:', word);
      handleKeywordClick(word);
    },
    getWordTooltip: (word: any) => {
      const keyword = keywords.find(k => k.text === word.text);
      if (keyword) {
        return `${keyword.text}\n검색량: ${keyword.searchVolume?.toLocaleString()}회\n트렌드: ${keyword.trend?.toFixed(1)}\n경쟁도: ${keyword.competition}\nCPC: $${keyword.cpc}`;
      }
      return `${word.text} (검색량: ${word.value})`;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
          🔍 네이버 데이터랩 키워드 트렌드
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          네이버 데이터랩은 검색어 트렌드와 쇼핑 인사이트 데이터를 제공합니다. 
          실제 네이버 검색 트렌드를 기반으로 한 키워드 분석을 확인할 수 있습니다.
        </Typography>

        {/* 검색 입력 */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="키워드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            disabled={isLoading}
          >
            검색
          </Button>
        </Box>

        {/* 선택된 키워드 정보 */}
        {selectedKeyword && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                📊 {selectedKeyword.text}
              </Typography>
              {onKeywordSelect && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    onKeywordSelect(selectedKeyword.text);
                    console.log('버튼 클릭으로 키워드 전달:', selectedKeyword.text);
                  }}
                  sx={{ fontSize: '0.75rem' }}
                >
                  검색어로 사용
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`검색량: ${selectedKeyword.searchVolume?.toLocaleString()}회`} 
                color="primary" 
                size="small" 
              />
              <Chip 
                label={`트렌드: ${selectedKeyword.trend?.toFixed(1)}`} 
                color="secondary" 
                size="small" 
              />
              <Chip 
                label={`경쟁도: ${selectedKeyword.competition}`} 
                color={selectedKeyword.competition === 'HIGH' ? 'error' : selectedKeyword.competition === 'MEDIUM' ? 'warning' : 'success'} 
                size="small" 
              />
              <Chip 
                label={`CPC: $${selectedKeyword.cpc}`} 
                color="info" 
                size="small" 
              />
            </Box>
          </Box>
        )}
        
        {/* 텍스트 클라우드 */}
        <Box sx={{ 
          height: 400, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          bgcolor: 'grey.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'grey.300',
          position: 'relative',
          '& text': {
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 0.8
            }
          }
        }}>
          {isLoading ? (
            <CircularProgress />
          ) : wordData.length > 0 ? (
            <div 
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                // SVG text 요소인지 확인
                const target = e.target as any;
                if (target.tagName === 'text') {
                  const text = target.textContent;
                  console.log('클릭된 텍스트:', text);
                  const keyword = keywords.find(k => k.text === text);
                  if (keyword) {
                    setSelectedKeyword(keyword);
                    if (onKeywordSelect) {
                      onKeywordSelect(keyword.text);
                    }
                  }
                }
              }}
            >
              <ReactWordcloud
                words={wordData}
                options={options}
                callbacks={callbacks}
              />
            </div>
          ) : (
            <Typography variant="body2" color="text.secondary">
              키워드 데이터가 없습니다.
            </Typography>
          )}
        </Box>
        
        {/* 안내 텍스트 */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 키워드를 클릭하면 검색어에 자동으로 입력됩니다.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            📈 트렌드가 높을수록 큰 폰트로 표시됩니다.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 