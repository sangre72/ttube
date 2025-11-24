import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 비디오 스니펫 정보 인터페이스
 */
interface VideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
}

/**
 * 비디오 통계 정보 인터페이스
 */
interface VideoStat {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

/**
 * YouTube 비디오 컨텐츠 상세 정보
 */
interface VideoContentDetails {
  duration: string; // ISO 8601 duration format (e.g., "PT4M13S")
}

/**
 * YouTube 비디오 정보 인터페이스
 */
export interface Video {
  id: string;
  snippet: VideoSnippet;
  statistics: VideoStat;
  contentDetails?: VideoContentDetails;
  relevanceScore?: number; // 관련성 점수 추가
}

/**
 * YouTube 카테고리 인터페이스
 */
export interface Category {
  id: string;
  snippet: {
    title: string;
    assignable: boolean;
  };
}

/**
 * 검색 기간 타입 정의
 */
export type SearchPeriod = '1일' | '1주일' | '1개월' | '작년동기' | '커스텀';

/**
 * YouTube Store 상태 인터페이스
 */
interface YoutubeState {
  // 데이터 상태
  videos: Video[];                    // 검색된 비디오 목록
  trendingVideos: Video[];           // 트렌드 비디오 목록
  categories: Category[];            // 카테고리 목록
  availableCategories: Category[];   // 실제 사용 가능한 카테고리 목록
  selectedCategory: string;          // 선택된 카테고리 ID
  
  // 로딩 상태
  isLoading: boolean;                // 검색 로딩 상태
  isTrendingLoading: boolean;        // 트렌드 로딩 상태
  isCategoriesLoading: boolean;      // 카테고리 로딩 상태
  isTestingCategories: boolean;      // 카테고리 테스트 로딩 상태
  
  // 에러 상태
  error: string | null;              // 에러 메시지
  
  // 검색 파라미터
  apiKey: string;                    // YouTube API 키
  searchQuery: string;               // 검색어
  minViewCount: number;              // 최소 조회수
  searchPeriod: SearchPeriod;        // 검색 기간
  customStartDate: string;           // 커스텀 시작 날짜
  customEndDate: string;             // 커스텀 종료 날짜
  
  // 액션 함수들
  setApiKey: (key: string) => void;
  setSearchQuery: (query: string) => void;
  setMinViewCount: (count: number) => void;
  setSearchPeriod: (period: SearchPeriod) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  
  // 유틸리티 함수들
  getSearchDateRange: () => { publishedAfter: string; publishedBefore: string };
  calculateRelevanceScore: (video: Video, searchQuery: string) => number;
  filterAndSortVideos: (videos: Video[], searchQuery: string, minViewCount: number) => Video[];
  
  // API 호출 함수들
  fetchVideos: () => Promise<void>;
  fetchTrendingVideos: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  testCategoryAvailability: (categoryId: string) => Promise<boolean>;
  testCategoryAvailabilityForAll: () => Promise<void>;
}

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Store 생성
 * Zustand를 사용한 상태 관리 (localStorage 지속성 포함)
 */
export const useYoutubeStore = create<YoutubeState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      videos: [],
      trendingVideos: [],
      categories: [],
      availableCategories: [],
      selectedCategory: '0', // 기본값: 전체 (0은 전체 카테고리)
      isLoading: false,
      isTrendingLoading: false,
      isCategoriesLoading: false,
      isTestingCategories: false,
      error: null,
      apiKey: '', // 초기값은 빈 문자열로 설정
      searchQuery: 'Next.js',
      minViewCount: 100000,
      searchPeriod: '작년동기',
      customStartDate: '',
      customEndDate: '',
      
      // 상태 설정 함수들
      setApiKey: (key) => set({ apiKey: key }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setMinViewCount: (count) => set({ minViewCount: count }),
      setSearchPeriod: (period) => set({ searchPeriod: period }),
      setCustomStartDate: (date) => set({ customStartDate: date }),
      setCustomEndDate: (date) => set({ customEndDate: date }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      
      /**
       * 검색 기간에 따른 날짜 범위 계산
       * @returns {publishedAfter, publishedBefore} 날짜 범위
       */
      getSearchDateRange: () => {
        const { searchPeriod, customStartDate, customEndDate } = get();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let publishedAfter: Date;
        let publishedBefore: Date = today;
        
        switch (searchPeriod) {
          case '1일':
            publishedAfter = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '1주일':
            publishedAfter = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1개월':
            publishedAfter = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '작년동기':
            // 작년의 오늘부터 1주일 전까지
            const lastYearToday = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            publishedAfter = new Date(lastYearToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            publishedBefore = lastYearToday;
            break;
          case '커스텀':
            publishedAfter = customStartDate ? new Date(customStartDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            publishedBefore = customEndDate ? new Date(customEndDate) : today;
            break;
          default:
            publishedAfter = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        
        return {
          publishedAfter: publishedAfter.toISOString(),
          publishedBefore: publishedBefore.toISOString()
        };
      },
      
      /**
       * 비디오의 관련성 점수 계산
       * @param video 비디오 정보
       * @param searchQuery 검색어
       * @returns 관련성 점수
       */
      calculateRelevanceScore: (video: Video, searchQuery: string) => {
        const title = video.snippet.title.toLowerCase();
        const query = searchQuery.toLowerCase();
        const queryWords = query.split(' ').filter(word => word.length > 0);
        
        let score = 0;
        
        // 제목에만 검색어가 포함된 경우 점수 부여 (채널명은 제외)
        queryWords.forEach(word => {
          if (title.includes(word)) {
            score += 15; // 제목에 검색어가 포함된 경우 높은 점수
          }
        });
        
        return score;
      },
      
      /**
       * 비디오 필터링 및 정렬
       * @param videos 비디오 목록
       * @param searchQuery 검색어
       * @param minViewCount 최소 조회수
       * @returns 필터링 및 정렬된 비디오 목록
       */
      filterAndSortVideos: (videos: Video[], searchQuery: string, minViewCount: number) => {
        return videos
          .filter(video => {
            const viewCount = parseInt(video.statistics.viewCount);
            return viewCount >= minViewCount;
          })
          .map(video => ({
            ...video,
            relevanceScore: get().calculateRelevanceScore(video, searchQuery)
          }))
          .sort((a, b) => {
            // 관련성 점수가 높은 순으로 정렬
            const scoreA = a.relevanceScore || 0;
            const scoreB = b.relevanceScore || 0;
            return scoreB - scoreA;
          });
      },
      
      /**
       * YouTube 비디오 검색
       */
      fetchVideos: async () => {
        const { apiKey, searchQuery, minViewCount, getSearchDateRange, filterAndSortVideos } = get();
        
        if (!apiKey.trim()) {
          set({ error: 'YouTube API 키를 입력해주세요.' });
          return;
        }
        
        if (!searchQuery.trim()) {
          set({ error: '검색어를 입력해주세요.' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const { publishedAfter, publishedBefore } = getSearchDateRange();
          
          const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
            params: {
              part: 'snippet',
              maxResults: 50,
              q: searchQuery,
              type: 'video',
              order: 'viewCount',
              publishedAfter,
              publishedBefore,
              key: apiKey
            }
          });
          
          const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
          
          if (videoIds) {
            const statsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
              params: {
                part: 'statistics,contentDetails',
                id: videoIds,
                key: apiKey
              }
            });
            
            const videosWithStats = response.data.items.map((item: any) => {
              const stats = statsResponse.data.items.find((statItem: any) => statItem.id === item.id.videoId);
              return {
                id: item.id.videoId,
                snippet: item.snippet,
                statistics: stats ? stats.statistics : { viewCount: '0', likeCount: '0', favoriteCount: '0', commentCount: '0' },
                contentDetails: stats ? stats.contentDetails : undefined
              };
            });
            
            const filteredAndSortedVideos = filterAndSortVideos(videosWithStats, searchQuery, minViewCount);
            
            set({ 
              videos: filteredAndSortedVideos,
              isLoading: false 
            });
          } else {
            set({ 
              videos: [],
              isLoading: false 
            });
          }
        } catch (error: any) {
          console.error('비디오 검색 오류:', error);
          set({ 
            error: error.response?.data?.error?.message || '비디오 검색 중 오류가 발생했습니다.',
            isLoading: false 
          });
        }
      },
      
      /**
       * 트렌드 비디오 가져오기
       */
      fetchTrendingVideos: async () => {
        const { apiKey, selectedCategory } = get();
        
        if (!apiKey.trim()) {
          return;
        }
        
        set({ isTrendingLoading: true });
        
        try {
          const params: any = {
            part: 'snippet,statistics,contentDetails',
            chart: 'mostPopular',
            regionCode: 'KR',
            maxResults: 20,
            key: apiKey
          };
          
          // 선택된 카테고리가 '전체'가 아닌 경우 카테고리 필터 적용
          if (selectedCategory !== '0') {
            params.videoCategoryId = selectedCategory;
          }
          
          const response = await axios.get(`${YOUTUBE_API_URL}/videos`, { params });
          
          const videos = response.data.items.map((item: any) => ({
            id: item.id,
            snippet: item.snippet,
            statistics: item.statistics
          }));
          
          set({ 
            trendingVideos: videos,
            isTrendingLoading: false 
          });
        } catch (error: any) {
          console.error('트렌드 비디오 가져오기 오류:', error);
          set({ 
            trendingVideos: [],
            isTrendingLoading: false 
          });
        }
      },
      
      /**
       * 카테고리 목록 가져오기
       */
      fetchCategories: async () => {
        const { apiKey } = get();
        
        if (!apiKey.trim()) {
          return;
        }
        
        set({ isCategoriesLoading: true });
        
        try {
          const response = await axios.get(`${YOUTUBE_API_URL}/videoCategories`, {
            params: {
              part: 'snippet',
              regionCode: 'KR',
              key: apiKey
            }
          });
          
          const categories = response.data.items.map((item: any) => ({
            id: item.id,
            snippet: item.snippet
          }));
          
          set({ 
            categories,
            isCategoriesLoading: false 
          });
          
          // 카테고리 가용성 테스트 시작
          get().testCategoryAvailabilityForAll();
        } catch (error: any) {
          console.error('카테고리 가져오기 오류:', error);
          set({ 
            categories: [],
            isCategoriesLoading: false 
          });
        }
      },
      
      /**
       * 모든 카테고리의 가용성 테스트
       */
      testCategoryAvailabilityForAll: async () => {
        const { categories, apiKey } = get();
        
        if (!apiKey.trim() || categories.length === 0) {
          return;
        }
        
        set({ isTestingCategories: true, availableCategories: [] });
        
        const availableCategories: Category[] = [];
        
        // 각 카테고리를 병렬로 테스트
        const testPromises = categories.map(async (category) => {
          const isAvailable = await get().testCategoryAvailability(category.id);
          if (isAvailable) {
            availableCategories.push(category);
          }
        });
        
        await Promise.all(testPromises);
        
        set({ 
          availableCategories,
          isTestingCategories: false 
        });
      },
      
      /**
       * 특정 카테고리의 가용성 테스트
       */
      testCategoryAvailability: async (categoryId: string) => {
        const { apiKey } = get();
        
        if (!apiKey.trim()) {
          return false;
        }
        
        try {
          const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
            params: {
              part: 'snippet',
              chart: 'mostPopular',
              regionCode: 'KR',
              videoCategoryId: categoryId,
              maxResults: 1,
              key: apiKey
            }
          });
          
          return response.data.items.length > 0;
        } catch (error) {
          return false;
        }
      }
    }),
    {
      name: 'youtube-store', // localStorage 키 이름
      partialize: (state) => ({
        // 지속할 상태만 선택
        selectedCategory: state.selectedCategory,
        apiKey: state.apiKey,
        searchQuery: state.searchQuery,
        minViewCount: state.minViewCount,
        searchPeriod: state.searchPeriod,
        customStartDate: state.customStartDate,
        customEndDate: state.customEndDate
      })
    }
  )
);
