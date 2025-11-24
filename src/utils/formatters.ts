/**
 * 조회수를 한국어 형식으로 포맷팅
 * @param count 조회수 문자열
 * @returns 포맷팅된 조회수 문자열
 */
export function formatViewCount(count: string): string {
  const num = parseInt(count, 10);
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toString();
}

/**
 * 날짜를 상대적 시간으로 포맷팅 (예: 3일 전, 2주 전)
 * @param dateString ISO 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주 전`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}년 전`;
  }
} 