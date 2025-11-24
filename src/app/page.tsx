'use client';
import AIEnhancementSection from '@/components/AIEnhancementSection';
import { KeywordCloud } from '@/components/KeywordCloud';
import { SearchForm } from '@/components/SearchForm';
import { SearchResultsSection } from '@/components/SearchResultsSection';
import { TranscriptionForm } from '@/components/TranscriptionForm';
import { TrendingSection } from '@/components/TrendingSection';
import { useTabStore } from '@/store/tabStore';
import { useYoutubeStore } from '@/store/youtubeStore';
import { Alert, Box, CircularProgress, Container, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';

/**
 * 메인 페이지 컴포넌트
 * YouTube 조회수 기반 검색 및 트렌드 순위 표시
 */
export default function HomePage() {
  const {
    videos, trendingVideos, categories, availableCategories, selectedCategory, 
    isLoading, isTrendingLoading, isCategoriesLoading, isTestingCategories, error, 
    apiKey, searchQuery, minViewCount, searchPeriod, customStartDate, customEndDate,
    setApiKey, setSearchQuery, setMinViewCount, setSearchPeriod, 
    setCustomStartDate, setCustomEndDate, setSelectedCategory, 
    fetchVideos, fetchTrendingVideos, fetchCategories
  } = useYoutubeStore();

  // 탭 상태 관리
  const { activeTab, setActiveTab, isHydrated } = useTabStore();

  // 스크립트 추출 결과 상태
  const [transcriptionText, setTranscriptionText] = React.useState<string>('');
  const [enhancedText, setEnhancedText] = React.useState<string>('');
  const [selectedYoutubeUrl, setSelectedYoutubeUrl] = React.useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = React.useState<string>('');
  const [currentVideoCategory, setCurrentVideoCategory] = React.useState<string>('');

  // 검색 폼 ref (스크롤 대상)
  const searchFormRef = React.useRef<HTMLDivElement>(null);

  // 환경 변수에서 API 키 설정 (클라이언트에서만)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_YOUTUBE_API_KEY && !apiKey) {
      setApiKey(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
    }
  }, [apiKey, setApiKey]);

  // 페이지 로드 시 카테고리 목록과 트렌드 비디오 가져오기
  React.useEffect(() => {
    fetchCategories();
    fetchTrendingVideos();
  }, [fetchCategories, fetchTrendingVideos]);

  // 카테고리 변경 시 트렌드 비디오 다시 가져오기
  React.useEffect(() => {
    if (categories.length > 0) {
      fetchTrendingVideos();
    }
  }, [selectedCategory, fetchTrendingVideos]);

  // 검색 폼 제출 핸들러
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await fetchVideos();
    
    // 검색 완료 후 검색 폼으로 스크롤
    if (searchFormRef.current) {
      searchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 스크립트 추출 완료 핸들러
  const handleTranscriptionComplete = (text: string) => {
    console.log('스크립트 추출 완료:', text);
    setTranscriptionText(text);
    setEnhancedText(''); // 새로운 스크립트가 추출되면 보강 결과 초기화
  };

  // AI 보강 완료 핸들러
  const handleEnhancedTextChange = (text: string) => {
    setEnhancedText(text);
  };

  // 스크립트 추출 버튼 클릭 핸들러
  const handleExtractScript = (youtubeUrl: string, videoTitle?: string, videoCategory?: string) => {
    setSelectedYoutubeUrl(youtubeUrl);
    setCurrentVideoTitle(videoTitle || '');
    setCurrentVideoCategory(videoCategory || '');
    setActiveTab('transcription');
  };

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'search' | 'transcription') => {
    setActiveTab(newValue);
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split('T')[0];
  
  // 환경 변수에서 API 키 확인 (클라이언트에서만)
  const hasEnvApiKey = typeof window !== 'undefined' ? !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY : false;

  // hydration이 완료될 때까지 로딩 표시
  if (!isHydrated) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* 페이지 제목 및 설명 */}
        <Typography variant="h4" component="h1" gutterBottom>
          YouTube 조회수 기반 검색 & 스크립트 추출
        </Typography>
        <Typography sx={{ mb: 3 }}>
          YouTube API 키를 입력하고, 검색어와 최소 조회수를 설정하여 동영상을 검색하거나, 
          YouTube 영상의 음성을 텍스트로 변환할 수 있습니다. 
          기본 검색 기간은 "작년동기"로 설정되어 있어 작년의 오늘부터 1주일 전까지의 데이터를 제공합니다.
        </Typography>

        {/* 탭 네비게이션 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="메인 탭">
            <Tab 
              label="🔍 YouTube 검색" 
              value="search" 
            />
            <Tab 
              label="🎤 스크립트 추출" 
              value="transcription" 
            />
          </Tabs>
        </Box>

        {/* 탭 컨텐츠 */}
        {activeTab === 'search' && (
          <Box sx={{ 
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}>
            {/* 키워드 클라우드 */}
            <KeywordCloud 
              searchQuery={searchQuery} 
              onKeywordSelect={async (keyword) => {
                console.log('페이지에서 받은 키워드:', keyword);
                setSearchQuery(keyword);
                // 검색어 상태가 업데이트된 후 자동으로 검색 실행
                await new Promise(resolve => setTimeout(resolve, 100));
                handleSearch();
              }}
            />
            
            {/* 검색 폼 */}
            <div ref={searchFormRef}>
              <SearchForm
                apiKey={apiKey}
                searchQuery={searchQuery}
                minViewCount={minViewCount}
                searchPeriod={searchPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                isLoading={isLoading}
                hasEnvApiKey={hasEnvApiKey}
                today={today}
                onApiKeyChange={setApiKey}
                onSearchQueryChange={setSearchQuery}
                onMinViewCountChange={setMinViewCount}
                onSearchPeriodChange={setSearchPeriod}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
                onSubmit={handleSearch}
              />
            </div>

            {/* 에러 메시지 표시 */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* 검색 결과 및 트렌딩 섹션 */}
            <div className="row">
              {/* 트렌딩 섹션 */}
              <TrendingSection
                trendingVideos={trendingVideos}
                categories={categories}
                availableCategories={availableCategories}
                selectedCategory={selectedCategory}
                isTrendingLoading={isTrendingLoading}
                isCategoriesLoading={isCategoriesLoading}
                isTestingCategories={isTestingCategories}
                onCategoryChange={handleCategoryChange}
                onExtractScript={handleExtractScript}
              />

              {/* 검색 결과 */}
              <SearchResultsSection
                videos={videos}
                searchQuery={searchQuery}
                minViewCount={minViewCount}
                onExtractScript={handleExtractScript}
              />
            </div>
          </Box>
        )}

        {activeTab === 'transcription' && (
          <Box sx={{ 
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
          }}>
            {/* 스크립트 추출 폼 */}
            <TranscriptionForm 
              onTranscriptionComplete={handleTranscriptionComplete}
              initialYoutubeUrl={selectedYoutubeUrl}
              initialVideoTitle={currentVideoTitle}
            />
            
            {/* 스크립트 결과 및 AI 보강 섹션 */}
            {(transcriptionText || enhancedText) && (
              <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', mt: 3 }}>
                {/* 좌측: 원본 스크립트 */}
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    minHeight: 300,
                    maxHeight: 500,
                    overflow: 'auto'
                  }}>
                    <Typography variant="h6" gutterBottom>
                      추출된 스크립트
                    </Typography>
                    <Box sx={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.6
                    }}>
                      {transcriptionText || '스크립트가 추출되지 않았습니다.'}
                    </Box>
                  </Box>
                </Box>

                {/* 우측: AI 보강 및 평가 */}
                <Box sx={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <AIEnhancementSection 
                    originalText={transcriptionText}
                    onEnhancedTextChange={handleEnhancedTextChange}
                    videoTitle={currentVideoTitle}
                    videoCategory={currentVideoCategory}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
