// route.ts
import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  currentSpeaker: 'A' | 'B';
  debateTopic: string;
  debateHistory?: string[];
}

export async function POST(request: Request) {
  const SURRENDER_MESSAGES = {
    A: "I concede as the PRO side - your arguments were too compelling!",
    B: "I surrender as the CON side - your position is too strong!"
  } as const; // Added 'as const' for stricter typing

  try {
    const requestBody: RequestBody = await request.json();
    const { currentSpeaker, debateTopic, messages, debateHistory = [] } = requestBody;

    // Get the last message from the opponent
    const lastOpponentMessage = messages
      .filter(m => m.role === 'assistant')
      .pop()?.content || '';

    // Role-specific instructions
    const ROLE_CONFIG = {
      A: {
        label: 'PRO',
        instruction: `You are strictly the PRO side supporting: "${debateTopic}".\n\n` +
          `Previous arguments:\n${debateHistory.join('\n')}\n\n` +
          `The CON side just said: "${lastOpponentMessage}"\n\n` +
          `Your task is to:\n` +
          `1. Maintain your PRO position supporting the topic\n` +
          `2. Counter the CON side's specific arguments\n` +
          `3. Provide 1-2 new supporting points\n` +
          `4. Keep responses concise (2-3 sentences max)\n\n` +
          `Never break character or concede. Always maintain your PRO position.`
      },
      B: {
        label: 'CON',
        instruction: `You are strictly the CON side opposing: "${debateTopic}".\n\n` +
          `Previous arguments:\n${debateHistory.join('\n')}\n\n` +
          `The PRO side just said: "${lastOpponentMessage}"\n\n` +
          `Your task is to:\n` +
          `1. Maintain your CON position opposing the topic\n` +
          `2. Counter the PRO side's specific arguments\n` +
          `3. Provide 1-2 new opposing points\n` +
          `4. Keep responses concise (2-3 sentences max)\n\n` +
          `Never break character or concede. Always maintain your CON position.`
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-debater-gee-pows-projects.vercel.app',
        'X-Title': 'AI Debate Arena'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [
          {
            role: "system",
            content: ROLE_CONFIG[currentSpeaker].instruction
          },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.8
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    if (!aiResponse) throw new Error('Empty AI response');

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Debate error:', error);
    const requestBody = await request.json().catch(() => ({ currentSpeaker: 'A' }));
    const currentSpeaker: 'A' | 'B' = requestBody.currentSpeaker || 'A';
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: SURRENDER_MESSAGES[currentSpeaker], // Now properly typed
      isSurrender: true
    });
  }
}