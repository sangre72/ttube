# 네이버 데이터랩 API 설정 가이드

## 1. 네이버 개발자 센터에서 API 키 발급

### 1.1 개발자 센터 접속
- [네이버 개발자 센터](https://developers.naver.com/)에 접속
- 네이버 계정으로 로그인

### 1.2 애플리케이션 등록
1. "애플리케이션 등록" 클릭
2. 애플리케이션 정보 입력:
   - 애플리케이션 이름: `YouTube-Top-Keyword-Analysis`
   - 사용 API: `데이터랩` 선택
   - 비즈니스 모델: `개발/테스트` 선택
   - 서비스 URL: `http://localhost:4000`
   - Callback URL: `http://localhost:4000`

### 1.3 API 키 확인
등록 완료 후 다음 정보를 확인:
- **Client ID**: 애플리케이션 정보에서 확인
- **Client Secret**: 애플리케이션 정보에서 확인

## 2. 환경 변수 설정

### 2.1 터미널에서 설정
```bash
export NAVER_CLIENT_ID="your_client_id_here"
export NAVER_CLIENT_SECRET="your_client_secret_here"
```

### 2.2 .env 파일 생성 (권장)
```bash
# python-server/.env 파일 생성
echo "NAVER_CLIENT_ID=your_client_id_here" > .env
echo "NAVER_CLIENT_SECRET=your_client_secret_here" >> .env
```

## 3. API 테스트

### 3.1 서버 재시작
```bash
cd python-server
uv run uvicorn main:app --host 0.0.0.0 --port 15000 --reload
```

### 3.2 API 테스트
```bash
# 키워드 트렌드 테스트
curl -X POST "http://localhost:15000/keywords/trends" \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["건강", "운동"]}'

# 쇼핑 인사이트 테스트
curl -X GET "http://localhost:15000/keywords/shopping"
```

## 4. API 응답 예시

### 4.1 성공 응답
```json
{
  "success": true,
  "keywords": [
    {
      "text": "건강",
      "value": 95,
      "searchVolume": 1500000,
      "trend": 85.5,
      "competition": "HIGH",
      "cpc": 4.28
    }
  ]
}
```

### 4.2 실패 응답 (API 키 없음)
```json
{
  "success": true,
  "keywords": [
    // 시뮬레이션 데이터 반환
  ]
}
```

## 5. 주의사항

- **API 호출 제한**: 네이버 데이터랩 API는 일일 호출 제한이 있습니다
- **인증 정보 보안**: Client Secret은 절대 공개하지 마세요
- **개발 환경**: 로컬 개발 시 localhost URL만 허용됩니다

## 6. 문제 해결

### 6.1 API 키 오류
```
"error": "Invalid client id or client secret"
```
- Client ID와 Client Secret이 올바른지 확인
- 환경 변수가 제대로 설정되었는지 확인

### 6.2 호출 제한 오류
```
"error": "API call limit exceeded"
```
- 일일 호출 제한을 초과한 경우
- 다음 날까지 대기하거나 시뮬레이션 모드 사용

### 6.3 네트워크 오류
```
"error": "Connection timeout"
```
- 네이버 서버 연결 문제
- 인터넷 연결 상태 확인 