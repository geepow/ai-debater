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
  currentRound?: number;
  totalRounds?: number;
}

export async function POST(request: Request) {
  const SURRENDER_MESSAGES = {
    A: "I concede the point - your arguments are compelling.",
    B: "I yield - your position is stronger in this debate."
  } as const;

  // 1. PARSE REQUEST SAFELY
  let requestBody: RequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  // 2. VALIDATE ESSENTIAL FIELDS
  if (!requestBody.debateTopic || !requestBody.currentSpeaker) {
    return NextResponse.json(
      { error: "Missing debate topic or speaker" },
      { status: 400 }
    );
  }

  const {
    currentSpeaker,
    debateTopic,
    messages = [],
    currentRound = 1,
    totalRounds = 3
  } = requestBody;

  // 3. PREPARE DEBATE STRATEGY
  const getDebateStrategy = () => {
    const lastMessage = messages
      .filter(m => m.role === 'assistant')
      .pop()?.content || 'No previous arguments';

    const position = currentSpeaker === 'A' ? 'PRO' : 'CON';
    
    if (currentRound === 1) {
      return `As ${position} in debate about "${debateTopic}", give opening statement with:
      - Clear position
      - 2 supporting arguments
      - 1 example
      - Keep under 3 sentences`;
    }

    if (currentRound === totalRounds) {
      return `As ${position} giving closing argument,:
      1. Summarize strongest point
      2. Counter: "${lastMessage}"
      3. End powerfully
      (2-3 sentences max)`;
    }

    return `As ${position} countering: "${lastMessage}":
    - Point out 1 flaw
    - Add 1 new argument
    - Keep under 4 sentences`;
  };

  // 4. API REQUEST WITH COMPREHENSIVE ERROR HANDLING
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // DEBUG: Log the request payload
    console.log('Sending to API:', {
      model: "anthropic/claude-3-haiku",
      messages: [{
        role: "system",
        content: getDebateStrategy()
      }, ...messages],
      max_tokens: 200
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{
          role: "system",
          content: getDebateStrategy()
        }, ...messages],
        max_tokens: 200,
        temperature: 0.7
      })
    });
    clearTimeout(timeout);

    // 5. HANDLE API RESPONSE
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // 6. FORMAT FINAL RESPONSE
    const formattedResponse = aiResponse
      .replace(/^(PRO|CON):?\s*/i, '')
      .replace(/\.$/, '') + (currentRound === totalRounds ? '!' : '.');

    return NextResponse.json({
      success: true,
      response: formattedResponse.charAt(0).toUpperCase() + formattedResponse.slice(1)
    });

  } catch (error) {
    console.error('Debate Error:', error);
    return NextResponse.json({
      success: false,
      response: SURRENDER_MESSAGES[currentSpeaker],
      isSurrender: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}