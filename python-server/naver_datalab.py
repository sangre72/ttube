"""
네이버 데이터랩 API 연동 모듈
검색어 트렌드와 쇼핑 인사이트 데이터를 가져옵니다.
"""

import os
import json
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class NaverDataLabService:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/datalab"
        
        logger.info(f"네이버 API 인증 정보 로드: Client ID = {'설정됨' if self.client_id else '설정되지 않음'}, Client Secret = {'설정됨' if self.client_secret else '설정되지 않음'}")
        
        if not self.client_id or not self.client_secret:
            logger.warning("네이버 API 인증 정보가 설정되지 않았습니다. 시뮬레이션 모드로 실행됩니다.")
        else:
            logger.info("네이버 API 인증 정보가 설정되었습니다. 실제 API 호출을 시도합니다.")
    
    def get_search_trends(self, keywords: List[str], start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        """
        네이버 검색어 트렌드 데이터 가져오기
        
        Args:
            keywords: 검색할 키워드 리스트
            start_date: 시작 날짜 (YYYY-MM-DD)
            end_date: 종료 날짜 (YYYY-MM-DD)
            
        Returns:
            키워드 트렌드 데이터 리스트
        """
        if not self.client_id or not self.client_secret:
            return self._get_mock_trend_data(keywords)
        
        try:
            # 날짜 설정 (기본값: 최근 30일)
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            if not end_date:
                end_date = datetime.now().strftime("%Y-%m-%d")
            
            # API 요청 데이터 구성
            request_data = {
                "startDate": start_date,
                "endDate": end_date,
                "timeUnit": "date",
                "keywordGroups": [
                    {
                        "groupName": keyword,
                        "keywords": [keyword],
                        "device": "pc,mo"
                    } for keyword in keywords
                ]
            }
            
            headers = {
                "X-Naver-Client-Id": self.client_id,
                "X-Naver-Client-Secret": self.client_secret,
                "Content-Type": "application/json"
            }
            
            logger.info(f"네이버 데이터랩 API 호출: {keywords}")
            
            response = requests.post(
                f"{self.base_url}/search",
                headers=headers,
                data=json.dumps(request_data)
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info("네이버 API 호출 성공 - 실제 데이터 반환")
                return self._process_trend_data(data, keywords)
            else:
                logger.error(f"네이버 API 오류: {response.status_code} - {response.text}")
                logger.info("API 오류로 인해 시뮬레이션 데이터 반환")
                return self._get_mock_trend_data(keywords)
                
        except Exception as e:
            logger.error(f"네이버 데이터랩 API 호출 실패: {e}")
            return self._get_mock_trend_data(keywords)
    
    def get_related_keywords(self, main_keyword: str) -> List[str]:
        """
        메인 키워드와 관련된 키워드 목록 생성
        
        Args:
            main_keyword: 메인 키워드
            
        Returns:
            관련 키워드 목록
        """
        # 키워드별 관련 키워드 매핑
        related_keywords_map = {
            "건강": [
                "건강식품", "건강검진", "건강보험", "건강관리", "건강한생활",
                "운동", "다이어트", "영양", "비타민", "보조식품",
                "헬스", "피트니스", "요가", "명상", "스트레스",
                "수면", "면역력", "체중관리", "혈압", "혈당"
            ],
            "운동": [
                "헬스", "피트니스", "요가", "러닝", "걷기",
                "수영", "등산", "자전거", "홈트레이닝", "스트레칭",
                "근력운동", "유산소운동", "다이어트", "체중감량", "근육",
                "체력", "지구력", "유연성", "균형감각", "코어운동"
            ],
            "다이어트": [
                "체중감량", "다이어트식품", "칼로리", "운동", "건강",
                "영양", "단백질", "탄수화물", "지방", "식단관리",
                "간헐적단식", "저탄고지", "채식", "건강식품", "보조식품",
                "체지방률", "기초대사량", "운동효과", "식사시간", "수분섭취"
            ],
            "영양": [
                "비타민", "미네랄", "단백질", "탄수화물", "지방",
                "식이섬유", "항산화제", "오메가3", "프로바이오틱스", "칼슘",
                "철분", "마그네슘", "아연", "셀레늄", "비타민C",
                "비타민D", "비타민B", "엽산", "콜라겐", "글루타민"
            ],
            "수면": [
                "불면증", "수면의질", "수면시간", "수면환경", "수면습관",
                "수면장애", "코골이", "무호흡증", "수면부족", "피로",
                "스트레스", "명상", "이완법", "수면제", "수면보조제",
                "수면리듬", "생체리듬", "멜라토닌", "카페인", "알코올"
            ]
        }
        
        # 메인 키워드에 대한 관련 키워드 반환
        if main_keyword in related_keywords_map:
            return related_keywords_map[main_keyword]
        
        # 기본 관련 키워드 (키워드 + 일반적인 접미사)
        default_related = [
            f"{main_keyword}추천", f"{main_keyword}정보", f"{main_keyword}팁",
            f"{main_keyword}방법", f"{main_keyword}효과", f"{main_keyword}후기",
            f"{main_keyword}가격", f"{main_keyword}구매", f"{main_keyword}리뷰",
            f"{main_keyword}비교", f"{main_keyword}순위", f"{main_keyword}브랜드"
        ]
        
        return default_related

    def get_search_trends_with_related(self, main_keyword: str, include_related: bool = True, max_related: int = 10) -> List[Dict[str, Any]]:
        """
        메인 키워드와 관련 키워드의 트렌드 데이터 가져오기
        
        Args:
            main_keyword: 메인 키워드
            include_related: 관련 키워드 포함 여부
            max_related: 최대 관련 키워드 수
            
        Returns:
            키워드 트렌드 데이터 (메인 + 관련 키워드)
        """
        keywords = [main_keyword]
        
        if include_related:
            related_keywords = self.get_related_keywords(main_keyword)[:max_related]
            keywords.extend(related_keywords)
        
        return self.get_search_trends(keywords)

    def get_shopping_insights(self, category: str = "50000000") -> List[Dict[str, Any]]:
        """
        네이버 쇼핑 인사이트 데이터 가져오기
        
        Args:
            category: 카테고리 ID (기본값: 전체)
            
        Returns:
            쇼핑 인사이트 데이터
        """
        if not self.client_id or not self.client_secret:
            return self._get_mock_shopping_data()
        
        try:
            # 쇼핑 인사이트 API는 별도 엔드포인트가 필요할 수 있음
            # 현재는 시뮬레이션 데이터 반환
            return self._get_mock_shopping_data()
            
        except Exception as e:
            logger.error(f"쇼핑 인사이트 API 호출 실패: {e}")
            return self._get_mock_shopping_data()
    
    def _process_trend_data(self, api_data: Dict[str, Any], keywords: List[str]) -> List[Dict[str, Any]]:
        """API 응답 데이터를 처리하여 키워드 데이터로 변환"""
        keyword_data = []
        
        try:
            results = api_data.get("results", [])
            
            for result in results:
                keyword = result.get("title", "")
                data_points = result.get("data", [])
                
                if data_points:
                    # 최근 데이터의 평균값 계산
                    recent_values = [point.get("ratio", 0) for point in data_points[-7:]]  # 최근 7일
                    avg_trend = sum(recent_values) / len(recent_values) if recent_values else 0
                    
                    # 검색량 추정 (실제 검색량은 제공되지 않으므로 트렌드 기반으로 추정)
                    estimated_volume = int(avg_trend * 10000)  # 트렌드 값에 비례하여 추정
                    
                    keyword_data.append({
                        "text": keyword,
                        "value": int(avg_trend * 10),  # 클라우드용 가중치
                        "searchVolume": estimated_volume,
                        "trend": avg_trend,
                        "competition": self._get_competition_level(avg_trend),
                        "cpc": self._estimate_cpc(avg_trend),
                        "dataPoints": data_points
                    })
            
            # 트렌드 순으로 정렬
            keyword_data.sort(key=lambda x: x["trend"], reverse=True)
            
        except Exception as e:
            logger.error(f"트렌드 데이터 처리 실패: {e}")
        
        return keyword_data
    
    def _get_competition_level(self, trend_value: float) -> str:
        """트렌드 값을 기반으로 경쟁도 추정"""
        if trend_value > 80:
            return "HIGH"
        elif trend_value > 40:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _estimate_cpc(self, trend_value: float) -> float:
        """트렌드 값을 기반으로 CPC 추정"""
        # 트렌드가 높을수록 CPC도 높다고 가정
        return round(trend_value / 20, 2)
    
    def _get_mock_trend_data(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """시뮬레이션된 트렌드 데이터"""
        mock_data = [
            {"text": "건강", "value": 95, "searchVolume": 1500000, "trend": 85.5, "competition": "HIGH", "cpc": 4.28},
            {"text": "운동", "value": 88, "searchVolume": 1200000, "trend": 78.2, "competition": "HIGH", "cpc": 3.91},
            {"text": "다이어트", "value": 82, "searchVolume": 980000, "trend": 72.1, "competition": "MEDIUM", "cpc": 3.61},
            {"text": "요리", "value": 78, "searchVolume": 850000, "trend": 68.5, "competition": "MEDIUM", "cpc": 3.43},
            {"text": "여행", "value": 75, "searchVolume": 720000, "trend": 65.2, "competition": "HIGH", "cpc": 3.26},
            {"text": "게임", "value": 72, "searchVolume": 680000, "trend": 62.8, "competition": "HIGH", "cpc": 3.14},
            {"text": "영화", "value": 68, "searchVolume": 620000, "trend": 59.1, "competition": "MEDIUM", "cpc": 2.96},
            {"text": "음악", "value": 65, "searchVolume": 580000, "trend": 56.3, "competition": "MEDIUM", "cpc": 2.82},
            {"text": "책", "value": 62, "searchVolume": 520000, "trend": 53.7, "competition": "LOW", "cpc": 2.69},
            {"text": "공부", "value": 58, "searchVolume": 480000, "trend": 50.2, "competition": "MEDIUM", "cpc": 2.51},
            {"text": "취미", "value": 55, "searchVolume": 450000, "trend": 47.8, "competition": "LOW", "cpc": 2.39},
            {"text": "패션", "value": 52, "searchVolume": 420000, "trend": 45.1, "competition": "HIGH", "cpc": 2.26},
            {"text": "뷰티", "value": 48, "searchVolume": 380000, "trend": 42.3, "competition": "MEDIUM", "cpc": 2.12},
            {"text": "자동차", "value": 45, "searchVolume": 350000, "trend": 39.8, "competition": "HIGH", "cpc": 1.99},
            {"text": "부동산", "value": 42, "searchVolume": 320000, "trend": 37.2, "competition": "HIGH", "cpc": 1.86}
        ]
        
        # 검색어가 있는 경우 필터링
        if keywords:
            filtered_data = []
            for keyword in keywords:
                keyword_lower = keyword.lower().strip()
                for data in mock_data:
                    data_text_lower = data["text"].lower()
                    if (keyword_lower == data_text_lower or 
                        keyword_lower in data_text_lower or 
                        data_text_lower in keyword_lower or
                        any(word in data_text_lower for word in keyword_lower.split())):
                        if data not in filtered_data:
                            filtered_data.append(data)
            
            filtered_data.sort(key=lambda x: x["trend"], reverse=True)
            return filtered_data[:15]
        
        return mock_data
    
    def _get_mock_shopping_data(self) -> List[Dict[str, Any]]:
        """시뮬레이션된 쇼핑 인사이트 데이터"""
        return [
            {"text": "스마트폰", "value": 90, "searchVolume": 1800000, "trend": 82.5, "competition": "HIGH", "cpc": 4.13},
            {"text": "노트북", "value": 85, "searchVolume": 1200000, "trend": 76.8, "competition": "HIGH", "cpc": 3.84},
            {"text": "헤드폰", "value": 80, "searchVolume": 950000, "trend": 71.2, "competition": "MEDIUM", "cpc": 3.56},
            {"text": "스마트워치", "value": 75, "searchVolume": 780000, "trend": 66.5, "competition": "MEDIUM", "cpc": 3.33},
            {"text": "태블릿", "value": 70, "searchVolume": 650000, "trend": 61.8, "competition": "MEDIUM", "cpc": 3.09}
        ]

# 전역 인스턴스
naver_datalab_service = NaverDataLabService() 