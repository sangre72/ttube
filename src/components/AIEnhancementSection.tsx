'use client';

import {
  AutoAwesome,
  CheckCircle,
  ContentCopy,
  Refresh
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { AIEnhancementRequest, AIEnhancementResponse, enhanceScript } from '../utils/aiEnhancement';

interface AIEnhancementSectionProps {
  originalText: string;
  onEnhancedTextChange?: (text: string) => void;
  videoTitle?: string;
  videoCategory?: string;
}

export default function AIEnhancementSection({ 
  originalText, 
  onEnhancedTextChange,
  videoTitle,
  videoCategory
}: AIEnhancementSectionProps) {
  const [enhancementType, setEnhancementType] = useState<'summarize' | 'expand' | 'improve' | 'improve_creative' | 'improve_creative_1min_novel' | 'improve_creative_1min_fact' | 'translate' | 'improve_expand' | 'improve_expand_translate' | 'analyze_structure' | 'generate_ideas' | 'improve_hooks' | 'competitive_script'>('improve');
  const [model, setModel] = useState<'claude' | 'grok' | 'openai'>('grok');
  const [language, setLanguage] = useState<string>('영어');
  const [userPrompt, setUserPrompt] = useState<string>(''); // 사용자 추가 프롬프트
  const [enhancedText, setEnhancedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const handleEnhance = async () => {
    if (!originalText.trim()) {
      setError('원본 텍스트가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setEnhancedText('');

    try {
      const request: AIEnhancementRequest = {
        originalText,
        model,
        enhancementType,
        language: (enhancementType === 'translate' || enhancementType === 'improve_expand_translate') ? language : undefined,
        userPrompt: userPrompt.trim() || undefined,
        videoTitle,
        videoCategory
      };

      const response: AIEnhancementResponse = await enhanceScript(request);

      if (response.success && response.enhancedText) {
        setEnhancedText(response.enhancedText);
        setProcessingTime(response.processingTime || 0);
        onEnhancedTextChange?.(response.enhancedText);
      } else {
        setError(response.error || 'AI 보강에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err?.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      // 순수한 보강된 텍스트만 복사 (제목이나 설명 없이)
      const textToCopy = enhancedText.trim();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleReset = () => {
    setEnhancedText('');
    setError('');
    setProcessingTime(0);
    setUserPrompt(''); // 사용자 프롬프트도 초기화
    onEnhancedTextChange?.('');
  };

  const getEnhancementTypeLabel = (type: string) => {
    const labels = {
      summarize: '요약',
      expand: '확장',
      improve: '개선',
      improve_creative: '특색있게 개선',
      improve_creative_1min_novel: '특색있게 개선 1분 소설',
      improve_creative_1min_fact: '특색있게 개선 1분 사실구성',
      translate: '번역',
      improve_expand: '개선,확장',
      improve_expand_translate: '개선,확장,번역',
      analyze_structure: '영상 구조 분석',
      generate_ideas: '새 영상 아이디어 생성',
      improve_hooks: '훅/도입부 개선',
      competitive_script: '경쟁력 있는 대본 작성'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getModelLabel = (model: string) => {
    const labels = {
      claude: 'Claude',
      grok: 'Grok',
      openai: 'OpenAI GPT'
    };
    return labels[model as keyof typeof labels] || model;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesome sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            AI 스크립트 보강
          </Typography>
        </Box>

        {/* 설정 패널 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>AI 모델</InputLabel>
              <Select
                value={model}
                label="AI 모델"
                onChange={(e) => setModel(e.target.value as 'claude' | 'grok' | 'openai')}
              >
                <MenuItem value="claude">Claude</MenuItem>
                <MenuItem value="grok">Grok</MenuItem>
                <MenuItem value="openai">OpenAI GPT</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>보강 유형</InputLabel>
              <Select
                value={enhancementType}
                label="보강 유형"
                onChange={(e) => setEnhancementType(e.target.value as any)}
              >
                <MenuItem value="summarize">요약</MenuItem>
                <MenuItem value="expand">확장</MenuItem>
                <MenuItem value="improve">개선</MenuItem>
                <MenuItem value="improve_creative_1min_novel">특색있게 개선 1분 소설</MenuItem>
                <MenuItem value="improve_creative_1min_fact">특색있게 개선 1분 사실구성</MenuItem>
                <MenuItem value="improve_expand">개선,확장</MenuItem>
                <MenuItem value="improve_expand_translate">개선,확장,번역</MenuItem>
                <MenuItem value="translate">번역</MenuItem>
                <MenuItem disabled sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>— 영상 분석 —</MenuItem>
                <MenuItem value="analyze_structure">영상 구조 분석</MenuItem>
                <MenuItem value="generate_ideas">새 영상 아이디어 생성</MenuItem>
                <MenuItem value="improve_hooks">훅/도입부 개선</MenuItem>
                <MenuItem value="competitive_script">경쟁력 있는 대본 작성</MenuItem>
              </Select>
            </FormControl>

            {(enhancementType === 'translate' || enhancementType === 'improve_expand_translate') && (
              <TextField
                size="small"
                label="번역 언어"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{ minWidth: 120 }}
              />
            )}
          </Box>

          {/* 사용자 추가 프롬프트 입력 */}
          <TextField
            fullWidth
            size="small"
            label="추가 요청사항 (선택사항)"
            placeholder="예: 더 친근한 톤으로 작성해주세요, 전문 용어를 쉽게 설명해주세요..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <Button
            variant="contained"
            onClick={handleEnhance}
            disabled={isLoading || !originalText.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
            sx={{ mr: 1 }}
          >
            {isLoading ? '처리 중...' : 
             userPrompt.trim() ? 
             `${getModelLabel(model)}로 ${getEnhancementTypeLabel(enhancementType)} + 사용자 요청` :
             `${getModelLabel(model)}로 ${getEnhancementTypeLabel(enhancementType)}`}
          </Button>

          {enhancedText && (
            <Button
              variant="outlined"
              onClick={handleReset}
              startIcon={<Refresh />}
            >
              초기화
            </Button>
          )}
        </Box>

        {/* 오류 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 결과 표시 */}
        {enhancedText && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                보강된 스크립트
                {userPrompt.trim() && (
                  <Chip
                    size="small"
                    label="사용자 요청 포함"
                    color="secondary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {processingTime > 0 && (
                  <Chip
                    size="small"
                    label={`${processingTime}ms`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                <Tooltip title="복사">
                  <IconButton size="small" onClick={handleCopy}>
                    {copied ? <CheckCircle color="success" /> : <ContentCopy />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'grey.50',
                overflow: 'auto',
                minHeight: 200,
                maxHeight: 400,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6
              }}
            >
              {enhancedText}
            </Box>
          </Box>
        )}

        {/* 안내 메시지 */}
        {!enhancedText && !isLoading && (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="body2" textAlign="center">
              AI 모델을 선택하고 보강 유형을 설정한 후<br />
              버튼을 클릭하여 스크립트를 보강하세요.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 