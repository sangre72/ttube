import { SearchPeriod } from '@/store/youtubeStore';
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React from 'react';
import { NumericFormat } from 'react-number-format';

interface SearchFormProps {
  apiKey: string;
  searchQuery: string;
  minViewCount: number;
  searchPeriod: SearchPeriod;
  customStartDate: string;
  customEndDate: string;
  isLoading: boolean;
  hasEnvApiKey: boolean;
  today: string;
  onApiKeyChange: (key: string) => void;
  onSearchQueryChange: (query: string) => void;
  onMinViewCountChange: (count: number) => void;
  onSearchPeriodChange: (period: SearchPeriod) => void;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * 검색 폼 컴포넌트
 * YouTube 동영상 검색을 위한 입력 폼
 */
export const SearchForm: React.FC<SearchFormProps> = ({
  apiKey,
  searchQuery,
  minViewCount,
  searchPeriod,
  customStartDate,
  customEndDate,
  isLoading,
  hasEnvApiKey,
  today,
  onApiKeyChange,
  onSearchQueryChange,
  onMinViewCountChange,
  onSearchPeriodChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onSubmit
}) => (
  <Box component="form" onSubmit={onSubmit} sx={{ mt: 3, mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
    <div className="row g-3 align-items-center">
      <div className="col-12 col-md-3">
        <TextField
          fullWidth
          label="YouTube API Key"
          type="password"
          variant="outlined"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={hasEnvApiKey ? "환경 변수에서 자동 로드됨" : "API 키를 입력하세요"}
          helperText={hasEnvApiKey ? "환경 변수에서 API 키가 설정되어 있습니다" : ".env.local 파일에 NEXT_PUBLIC_YOUTUBE_API_KEY 설정 가능"}
          required={!hasEnvApiKey}
        />
      </div>
      <div className="col-12 col-md-2">
        <TextField
          fullWidth
          label="검색어"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          required
        />
      </div>
      <div className="col-12 col-md-2">
        <NumericFormat
          customInput={TextField}
          fullWidth
          label="최소 조회수"
          variant="outlined"
          value={minViewCount}
          thousandSeparator
          onValueChange={(values) => {
            const { floatValue } = values;
            onMinViewCountChange(floatValue || 0);
          }}
          required
        />
      </div>
      <div className="col-12 col-md-2">
        <FormControl fullWidth variant="outlined">
          <InputLabel>검색 기간</InputLabel>
          <Select
            value={searchPeriod}
            label="검색 기간"
            onChange={(e) => onSearchPeriodChange(e.target.value as SearchPeriod)}
          >
            <MenuItem value="1일">1일</MenuItem>
            <MenuItem value="1주일">1주일</MenuItem>
            <MenuItem value="1개월">1개월</MenuItem>
            <MenuItem value="작년동기">작년동기 (작년 오늘~1주일 전)</MenuItem>
            <MenuItem value="커스텀">커스텀</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="col-12 col-md-3">
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ height: '56px' }}
        >
          {isLoading ? <CircularProgress size={24} /> : '검색'}
        </Button>
      </div>
    </div>
    
    {/* 커스텀 날짜 선택 */}
    {searchPeriod === '커스텀' && (
      <div className="row g-3 mt-2">
        <div className="col-12 col-md-6">
          <TextField
            fullWidth
            label="시작 날짜"
            type="date"
            variant="outlined"
            value={customStartDate}
            onChange={(e) => onCustomStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: today }}
            required
          />
        </div>
        <div className="col-12 col-md-6">
          <TextField
            fullWidth
            label="종료 날짜"
            type="date"
            variant="outlined"
            value={customEndDate}
            onChange={(e) => onCustomEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: today }}
            required
          />
        </div>
      </div>
    )}
    
    {/* 선택된 기간 표시 */}
    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="body2" color="text.secondary">
        검색 기간: {
          searchPeriod === '커스텀' 
            ? `${customStartDate} ~ ${customEndDate}`
            : searchPeriod === '작년동기'
            ? '작년 오늘부터 1주일 전까지'
            : `최근 ${searchPeriod} (오늘 기준)`
        }
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        검색 방식: 제목에 검색어가 포함된 동영상만 표시
      </Typography>
    </Box>
  </Box>
); 