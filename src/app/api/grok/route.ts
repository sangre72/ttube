import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const grokApiKey = process.env.NEXT_PUBLIC_GROK_API_KEY;
    if (!grokApiKey) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_GROK_API_KEY 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Grok API 호출
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful YouTube content creation assistant. Always respond in Korean.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-2-1212',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      return NextResponse.json(
        { error: `Grok API 호출 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const grokResponse = data.choices[0]?.message?.content || '';

    return NextResponse.json({
      response: grokResponse,
      success: true,
      model: 'grok'
    });

  } catch (error: any) {
    console.error('Grok API error:', error);
    return NextResponse.json(
      { error: 'Grok API 호출 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}