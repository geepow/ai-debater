import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  personality: 'supportive' | 'critical';
  messages: ChatMessage[];
  model?: string;
  currentSpeaker?: 'A' | 'B'; // Added for surrender messages
}

export async function POST(request: Request) {
  // Default surrender messages
  const SURRENDER_MESSAGES = {
    supportive: "I concede the debate - your counterarguments were too strong!",
    critical: "I surrender - your position is more convincing than mine!"
  };

  try {
    // 1. Parse request safely
    const requestBody: RequestBody = await request.json().catch(() => {
      throw new Error("Invalid request format");
    });

    // 2. Get speaker role (default to 'supportive' if missing)
    const personality = requestBody.personality || 'supportive';
    const currentSpeaker = requestBody.currentSpeaker || 'A';

    // 3. Make API request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-debater-gee-pows-projects.vercel.app',
        'X-Title': 'AI Debate App'
      },
      body: JSON.stringify({
        model: requestBody.model || "deepseek/deepseek-chat:free",
        messages: [
          {
            role: "system",
            content: `You are debating with a ${personality} perspective. Respond in 2-3 concise sentences.`
          },
          ...requestBody.messages.filter(m => m.content.trim().length > 0) // Filter empty messages
        ],
        max_tokens: 150 // Shorter responses for reliability
      })
    });
    clearTimeout(timeout);

    // 4. Handle API response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    // 5. Validate AI response
    if (!aiResponse) {
      throw new Error("AI returned empty response");
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      speaker: currentSpeaker
    });

  } catch (error: unknown) {
    // 6. Graceful fallback
    const personality = (error as { personality?: 'supportive' | 'critical' })?.personality || 'supportive';
    
    return NextResponse.json({
      success: false,
      response: SURRENDER_MESSAGES[personality],
      isSurrender: true,
      speaker: (error as { currentSpeaker?: 'A' | 'B' })?.currentSpeaker || 'A'
    });
  }
}