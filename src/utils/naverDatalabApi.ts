/**
 * 네이버 데이터랩 API 키워드 트렌드 데이터 가져오기
 * 검색어 트렌드와 쇼핑 인사이트 데이터를 제공
 */

export interface KeywordData {
  text: string;
  value: number;
  searchVolume?: number;
  trend?: number;
  competition?: string;
  cpc?: number;
  dataPoints?: any[];
}

/**
 * 네이버 데이터랩 키워드 트렌드 API 호출
 * 백엔드 API를 통해 실제 또는 시뮬레이션된 데이터를 가져옴
 */
export const getKeywordTrends = async (searchQuery?: string): Promise<KeywordData[]> => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:15000';
    
    console.log('네이버 데이터랩 키워드 검색 시작:', searchQuery);
    
    // 검색어가 있는 경우 해당 키워드로 API 호출
    if (searchQuery && searchQuery.trim()) {
      console.log('실제 네이버 API 호출 시도:', searchQuery.trim());
      
      const response = await fetch(`${API_BASE_URL}/keywords/trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: [searchQuery.trim()],
          start_date: getDateDaysAgo(30), // 최근 30일
          end_date: getCurrentDate()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('네이버 API 응답:', data);
        
        if (data.success && data.keywords && data.keywords.length > 0) {
          console.log('실제 네이버 API 데이터 반환:', data.keywords.length, '개');
          return data.keywords;
        } else {
          console.log('네이버 API 응답이 비어있음, 모의 데이터로 폴백');
        }
      } else {
        console.log('네이버 API 호출 실패:', response.status, response.statusText);
      }
    }

    // 검색어가 없거나 API 호출 실패 시 모의 데이터 반환
    console.log('모의 데이터 API 호출');
    const response = await fetch(`${API_BASE_URL}/keywords/mock`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('모의 데이터 반환:', data.keywords.length, '개');
        return data.keywords;
      }
    }

    // 모든 API 호출이 실패한 경우 기본 데이터 반환
    console.log('모든 API 호출 실패, 로컬 모의 데이터 반환');
    return getMockKeywordData(searchQuery);
  } catch (error) {
    console.error('네이버 데이터랩 API 호출 실패:', error);
    return getMockKeywordData(searchQuery);
  }
};

/**
 * 메인 키워드와 관련 키워드의 트렌드 데이터 가져오기
 */
export const getRelatedKeywords = async (mainKeyword: string, includeRelated: boolean = true, maxRelated: number = 10): Promise<KeywordData[]> => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:15000';
    
    console.log('관련 키워드 검색 시작:', mainKeyword);
    
    const response = await fetch(`${API_BASE_URL}/keywords/related`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: mainKeyword,
        include_related: includeRelated,
        max_related: maxRelated
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('관련 키워드 API 응답:', data);
      
      if (data.success && data.keywords && data.keywords.length > 0) {
        console.log('관련 키워드 데이터 반환:', data.keywords.length, '개');
        return data.keywords;
      } else {
        console.log('관련 키워드 API 응답이 비어있음');
      }
    } else {
      console.log('관련 키워드 API 호출 실패:', response.status, response.statusText);
    }

    // API 호출 실패 시 기본 키워드 트렌드로 폴백
    return getKeywordTrends(mainKeyword);
  } catch (error) {
    console.error('관련 키워드 API 호출 실패:', error);
    return getKeywordTrends(mainKeyword);
  }
};

/**
 * 쇼핑 인사이트 데이터 가져오기
 */
export const getShoppingInsights = async (): Promise<KeywordData[]> => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:15000';
    
    const response = await fetch(`${API_BASE_URL}/keywords/shopping`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.keywords;
      }
    }
    
    return getMockShoppingData();
  } catch (error) {
    console.error('쇼핑 인사이트 API 호출 실패:', error);
    return getMockShoppingData();
  }
};

/**
 * 키워드 데이터를 텍스트 클라우드용으로 변환
 */
export const transformKeywordDataForCloud = (keywordData: KeywordData[]): Array<{text: string, value: number}> => {
  return keywordData.map(keyword => ({
    text: keyword.text,
    value: keyword.value
  }));
};

/**
 * 시뮬레이션된 키워드 데이터 (API 실패 시 폴백)
 */
const getMockKeywordData = (searchQuery?: string): KeywordData[] => {
  const mockKeywordData: KeywordData[] = [
    { text: '건강', value: 95, searchVolume: 1500000, trend: 85.5, competition: 'HIGH', cpc: 4.28 },
    { text: '운동', value: 88, searchVolume: 1200000, trend: 78.2, competition: 'HIGH', cpc: 3.91 },
    { text: '다이어트', value: 82, searchVolume: 980000, trend: 72.1, competition: 'MEDIUM', cpc: 3.61 },
    { text: '요리', value: 78, searchVolume: 850000, trend: 68.5, competition: 'MEDIUM', cpc: 3.43 },
    { text: '여행', value: 75, searchVolume: 720000, trend: 65.2, competition: 'HIGH', cpc: 3.26 },
    { text: '게임', value: 72, searchVolume: 680000, trend: 62.8, competition: 'HIGH', cpc: 3.14 },
    { text: '영화', value: 68, searchVolume: 620000, trend: 59.1, competition: 'MEDIUM', cpc: 2.96 },
    { text: '음악', value: 65, searchVolume: 580000, trend: 56.3, competition: 'MEDIUM', cpc: 2.82 },
    { text: '책', value: 62, searchVolume: 520000, trend: 53.7, competition: 'LOW', cpc: 2.69 },
    { text: '공부', value: 58, searchVolume: 480000, trend: 50.2, competition: 'MEDIUM', cpc: 2.51 },
    { text: '취미', value: 55, searchVolume: 450000, trend: 47.8, competition: 'LOW', cpc: 2.39 },
    { text: '패션', value: 52, searchVolume: 420000, trend: 45.1, competition: 'HIGH', cpc: 2.26 },
    { text: '뷰티', value: 48, searchVolume: 380000, trend: 42.3, competition: 'MEDIUM', cpc: 2.12 },
    { text: '자동차', value: 45, searchVolume: 350000, trend: 39.8, competition: 'HIGH', cpc: 1.99 },
    { text: '부동산', value: 42, searchVolume: 320000, trend: 37.2, competition: 'HIGH', cpc: 1.86 }
  ];

  // 검색어가 있는 경우 관련 키워드 필터링
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    return mockKeywordData.filter(keyword => 
      keyword.text.toLowerCase().includes(query) ||
      query.includes(keyword.text.toLowerCase())
    );
  }

  return mockKeywordData;
};

/**
 * 시뮬레이션된 쇼핑 인사이트 데이터
 */
const getMockShoppingData = (): KeywordData[] => {
  return [
    { text: '스마트폰', value: 90, searchVolume: 1800000, trend: 82.5, competition: 'HIGH', cpc: 4.13 },
    { text: '노트북', value: 85, searchVolume: 1200000, trend: 76.8, competition: 'HIGH', cpc: 3.84 },
    { text: '헤드폰', value: 80, searchVolume: 950000, trend: 71.2, competition: 'MEDIUM', cpc: 3.56 },
    { text: '스마트워치', value: 75, searchVolume: 780000, trend: 66.5, competition: 'MEDIUM', cpc: 3.33 },
    { text: '태블릿', value: 70, searchVolume: 650000, trend: 61.8, competition: 'MEDIUM', cpc: 3.09 }
  ];
};

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * N일 전 날짜를 YYYY-MM-DD 형식으로 반환
 */
const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}; 