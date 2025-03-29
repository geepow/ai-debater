import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages, personality } = await request.json();
    
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-debater-gee-pows-projects.vercel.app/', // Replace with your domain
        'X-Title': 'AI Debate App'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [{
          role: "system",
          content: `You are debating with a ${personality} perspective. Respond concisely.`
        }, ...messages]
      })
    });

    const data = await openRouterResponse.json();
    
    if (!openRouterResponse.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    return NextResponse.json({
      success: true,
      response: data.choices[0]?.message?.content
    });
    
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}