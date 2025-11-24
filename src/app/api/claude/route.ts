import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    // Claude CLI 명령어 실행
    try {
      console.log('Claude CLI 실행 중...');
      // 프롬프트의 모든 특수 문자를 이스케이프 처리
      const escapedPrompt = prompt
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`');
      
      const command = `claude -p "${escapedPrompt}"`;
      console.log('명령어:', command.substring(0, 100) + '...');
      
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr) {
        console.error('Claude CLI stderr:', stderr);
      }
      
      console.log('Claude CLI 응답:', stdout.substring(0, 200) + '...');

      return NextResponse.json({
        response: stdout.trim(),
        success: true,
        model: 'claude'
      });
    } catch (error: any) {
      console.error('Claude CLI execution error:', error);
      return NextResponse.json(
        { 
          error: 'Claude CLI 실행에 실패했습니다. Claude Code가 설치되어 있는지 확인해주세요.',
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}