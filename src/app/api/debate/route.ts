import { NextResponse } from 'next/server';

// Define proper TypeScript interfaces
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  personality: 'supportive' | 'critical';
  messages: ChatMessage[];
  model?: string;
}

export async function POST(request: Request) {
  try {
    const requestBody: RequestBody = await request.json();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yourdomain.com', // Replace with your actual domain
        'X-Title': 'AI Debate App'
      },
      body: JSON.stringify({
        model: requestBody.model || "deepseek/deepseek-chat:free",
        messages: [
          {
            role: "system",
            content: `You are debating with a ${requestBody.personality} perspective. Respond concisely.`
          },
          ...requestBody.messages
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    return NextResponse.json({
      success: true,
      response: data.choices[0]?.message?.content
    });
    
  } catch (error: unknown) { // Note: Using 'unknown' instead of 'any'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Route Error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}