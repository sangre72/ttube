// AI 스크립트 보강 유틸리티

export interface AIEnhancementRequest {
  originalText: string;
  model: 'claude' | 'grok' | 'openai';
  enhancementType: 'summarize' | 'expand' | 'improve' | 'improve_creative' | 'improve_creative_1min_novel' | 'improve_creative_1min_fact' | 'translate' | 'improve_expand' | 'improve_expand_translate' | 'analyze_structure' | 'generate_ideas' | 'improve_hooks' | 'competitive_script';
  language?: string;
  userPrompt?: string; // 사용자 추가 프롬프트
  videoTitle?: string; // 영상 제목 (분석용)
  videoCategory?: string; // 영상 카테고리 (분석용)
}

export interface AIEnhancementResponse {
  success: boolean;
  enhancedText?: string;
  error?: string;
  processingTime?: number;
}

// Claude API 호출
async function callClaudeAPI(text: string, prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Claude API 키가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n원본 텍스트:\n${text}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API 오류: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Grok API 호출 (xAI API)
async function callGrokAPI(text: string, prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROK_API_KEY;
  
  if (!apiKey) {
    throw new Error('Grok API 키가 설정되지 않았습니다.');
  }

  // xAI Grok API 엔드포인트
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that enhances text content.'
        },
        {
          role: 'user',
          content: `${prompt}\n\n원본 텍스트:\n${text}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Grok API 응답:', response.status, errorText);
    
    if (response.status === 404) {
      throw new Error('Grok API 엔드포인트를 찾을 수 없습니다. API 키와 엔드포인트를 확인해주세요.');
    } else if (response.status === 401) {
      throw new Error('Grok API 인증에 실패했습니다. API 키를 확인해주세요.');
    } else if (response.status === 403) {
      throw new Error('Grok API 접근이 거부되었습니다. API 키 권한을 확인해주세요.');
    } else {
      throw new Error(`Grok API 오류: ${response.status} - ${errorText}`);
    }
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Grok API 응답 형식이 올바르지 않습니다.');
  }
  
  return data.choices[0].message.content;
}

// OpenAI API 호출 (Grok 대안)
async function callOpenAIAPI(text: string, prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',  // 또는 'gpt-3.5-turbo'
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n원본 텍스트:\n${text}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API 응답:', response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('OpenAI API 인증에 실패했습니다. API 키를 확인해주세요.');
    } else if (response.status === 429) {
      throw new Error('OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorText}`);
    }
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('OpenAI API 응답 형식이 올바르지 않습니다.');
  }
  
  return data.choices[0].message.content;
}

// 프롬프트 생성
function generatePrompt(enhancementType: string, language?: string, userPrompt?: string, videoTitle?: string, videoCategory?: string): string {
  const basePrompts = {
    summarize: '다음 텍스트를 간결하고 명확하게 요약해주세요. 핵심 내용만 포함하여 2-3문장으로 정리해주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    expand: '다음 텍스트를 더 자세하고 풍부하게 확장해주세요. 배경 정보, 예시, 설명을 추가하여 이해하기 쉽게 만들어주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    improve: '다음 텍스트를 더 자연스럽고 읽기 쉽게 개선해주세요. 문법, 어조, 표현을 수정하여 완성도 높은 텍스트로 만들어주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    improve_creative: '다음 텍스트를 특색있고 창의적으로 개선해주세요. 원문의 의미는 유지하면서 더 매력적이고 독창적인 표현으로 바꿔주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    improve_creative_1min_novel: '다음 텍스트를 1분 소설 형식으로 특색있게 개선해주세요. 소설적 요소를 추가하여 흥미롭고 몰입감 있는 스토리로 만들어주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    improve_creative_1min_fact: '다음 텍스트를 1분 사실구성 형식으로 특색있게 개선해주세요. 길이는 15에서 20줄이 좋을 것 같아요.  사실에 기반하여 논리적이고 체계적으로 구성해주세요. 번호 필요 없이 사람이 말해주는 듯하게 표현해주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    translate: `다음 텍스트를 ${language || '한국어'}로 번역해주세요. 원문의 의미와 뉘앙스를 최대한 살려서 번역해주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.`,
    improve_expand: '다음 텍스트를 개선하고 확장해주세요. 먼저 문법, 어조, 표현을 개선한 후, 배경 정보, 예시, 설명을 추가하여 더 풍부하고 이해하기 쉬운 텍스트로 만들어주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.',
    improve_expand_translate: `다음 텍스트를 개선하고 확장해주세요. 먼저 문법, 어조, 표현을 개선한 후, 배경 정보, 예시, 설명을 추가하여 더 풍부하고 이해하기 쉬운 텍스트로 만들어주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요. 그리고 마지막으로 ${language || '한국어'}로 번역해주세요. 부가 설명은 필요 없고 작업된 내용만 알려주세요.`,
    
    // 새로운 영상 분석 프롬프트
    analyze_structure: `다음 YouTube 영상 대본을 분석해주세요.
${videoTitle ? `영상 제목: ${videoTitle}` : ''}
${videoCategory ? `카테고리: ${videoCategory}` : ''}

분석 항목:
1. 핵심 주제와 메시지
2. 스토리텔링 구조 (도입-전개-클라이맥스-결론)
3. 시청자 참여 유도 기법
4. 감정적 훅(hook) 포인트
5. 정보 전달 방식의 특징
6. 처음 15초의 훅 분석
7. 시청 지속률을 높이는 구성 요소
8. 감정적 연결 포인트
9. 타겟 오디언스 특성
10. 댓글/참여 유도 기법`,

    generate_ideas: `이 영상을 기반으로 5개의 새로운 영상 아이디어를 제안해주세요.
${videoTitle ? `원본 영상 제목: ${videoTitle}` : ''}
${videoCategory ? `카테고리: ${videoCategory}` : ''}

각 아이디어마다 포함해주세요:
1. 클릭을 유도하는 제목 (2-3개 옵션)
2. 타겟 시청자
3. 예상 영상 길이
4. 핵심 차별화 포인트
5. 썸네일 컨셉
6. 예상 조회수 범위
7. 제작 난이도 (상/중/하)`,

    improve_hooks: `이 영상의 장점을 유지하면서 다음 관점에서 개선된 버전을 제안해주세요:

1. 더 강력한 도입부 (첫 15초) - 3가지 버전 제시
2. 시청 지속률을 높일 수 있는 구성 변경안
3. 추가할 수 있는 시각적 요소
4. 대상 시청자층 확대 방안
5. 트렌드 키워드 자연스럽게 포함시키기
6. 알고리즘 친화적 요소 추가
7. 공유하고 싶게 만드는 요소`,

    competitive_script: `다음 요소를 포함한 경쟁력 있는 영상 대본을 작성해주세요.
${videoTitle ? `주제: ${videoTitle}` : ''}
${videoCategory ? `카테고리: ${videoCategory}` : ''}

필수 포함 요소:
1. 강력한 훅 (0-15초) - 시청자를 즉시 사로잡는 오프닝
2. 스토리텔링 요소 - 개인적 경험이나 사례
3. 데이터/통계 활용 - 신뢰성 있는 정보
4. 시청자 질문/참여 유도 - 댓글 유도 전략
5. 명확한 CTA (Call to Action)
6. 예상 시청 시간: 8-12분
7. 중간 중간 시청 유지 포인트
8. SEO 최적화된 설명문 초안`
  };

  let prompt = basePrompts[enhancementType as keyof typeof basePrompts] || basePrompts.improve;
  
  // 사용자 프롬프트가 있으면 추가
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\n추가 요청사항: ${userPrompt.trim()}`;
  }

  return prompt;
}

// 메인 AI 보강 함수
export async function enhanceScript(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
  const startTime = Date.now();
  
  try {
    const prompt = generatePrompt(request.enhancementType, request.language, request.userPrompt, request.videoTitle, request.videoCategory);
    let enhancedText: string;

    if (request.model === 'claude') {
      enhancedText = await callClaudeAPI(request.originalText, prompt);
    } else if (request.model === 'grok') {
      enhancedText = await callGrokAPI(request.originalText, prompt);
    } else if (request.model === 'openai') {
      enhancedText = await callOpenAIAPI(request.originalText, prompt);
    } else {
      throw new Error('지원하지 않는 AI 모델입니다.');
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      enhancedText,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      processingTime
    };
  }
}

// 환경 변수 확인 함수
export function checkAPIKeys(): { claude: boolean; grok: boolean; openai: boolean } {
  return {
    claude: !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    grok: !!process.env.NEXT_PUBLIC_GROK_API_KEY,
    openai: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY
  };
} 