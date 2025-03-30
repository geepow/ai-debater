import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  currentSpeaker: 'A' | 'B';
  debateTopic: string;
  debateHistory: string[];
  currentRound: number;
  totalRounds: number;
  opponentSurrendered?: boolean;
}

export async function POST(request: Request) {
  const SURRENDER_MESSAGES = {
    A: "I concede the point - your arguments are compelling.",
    B: "I yield - your position is stronger in this debate."
  };

  // Initialize with default values
  let requestBody: RequestBody = {
    messages: [],
    currentSpeaker: 'A',
    debateTopic: '',
    debateHistory: [],
    currentRound: 1,
    totalRounds: 3
  };

  try {
    // Parse and validate request body
    const parsedBody = await request.json();
    requestBody = {
      ...requestBody,
      ...parsedBody
    };

    const {
      currentSpeaker,
      debateTopic,
      messages = [],
      debateHistory = [],
      currentRound = 1,
      totalRounds = 3,
      opponentSurrendered = false
    } = requestBody;

    // Validate required fields
    if (!debateTopic) {
      throw new Error('Missing debate topic');
    }

    // If opponent surrendered, return immediate concession
    if (opponentSurrendered) {
      return NextResponse.json({
        success: true,
        response: SURRENDER_MESSAGES[currentSpeaker],
        isSurrender: true
      });
    }

    // Enhanced phased debate strategy
    const getDebateStrategy = () => {
      const position = currentSpeaker === 'A' ? 'PRO' : 'CON';
      const opponentPosition = currentSpeaker === 'A' ? 'CON' : 'PRO';
      const lastOpponentMessage = debateHistory[debateHistory.length - 1] || 'No previous arguments';

      // Opening statement
      if (currentRound === 1) {
        return `As the ${position} side in a debate about "${debateTopic}", present your OPENING ARGUMENT with:
1. Clear thesis statement (1 sentence)
2. Two strong supporting points (mark with •)
3. One hypothetical example
4. Confident conclusion (1 sentence)

Keep response under 4 sentences. Never break character.`;
      }

      // Closing argument
      if (currentRound === totalRounds) {
        return `As the ${position} side giving your CLOSING ARGUMENT:
1. Summarize your strongest remaining point
2. Counter this ${opponentPosition} argument: "${lastOpponentMessage}"
3. End with impactful final statement

Use persuasive language. 3 sentences maximum.`;
      }

      // Mid-debate rebuttal
      return `As the ${position} side countering the ${opponentPosition} argument:
1. Directly rebut: "${lastOpponentMessage}"
2. Point out one logical flaw
3. Add one new supporting point
4. Connect back to your core position

Use phrases like "This fails because..." and "More importantly...". 4 sentences maximum.`;
    };

    // API call with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'AI Debate Arena'
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku", // Fast and capable
        messages: [{
          role: "system",
          content: getDebateStrategy()
        }, ...messages],
        max_tokens: 250,
        temperature: 0.7,
        top_p: 0.9
      })
    });
    clearTimeout(timeout);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', apiResponse.status, errorText);
      throw new Error(`API responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error('Received empty response from AI');
    }

    // Format the response based on debate phase
    const formattedResponse = formatDebateResponse(
      aiResponse,
      currentSpeaker,
      currentRound,
      totalRounds
    );

    return NextResponse.json({
      success: true,
      response: formattedResponse
    });

  } catch (error) {
    console.error('Debate error:', error);
    const currentSpeaker = requestBody.currentSpeaker || 'A';
    
    return NextResponse.json({
      success: false,
      response: SURRENDER_MESSAGES[currentSpeaker],
      isSurrender: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Formats the AI response for better debate flow
function formatDebateResponse(
  text: string,
  speaker: 'A' | 'B',
  currentRound: number,
  totalRounds: number
): string {
  const position = speaker === 'A' ? 'PRO' : 'CON';
  
  // Remove any role prefixes
  let cleaned = text.replace(new RegExp(`^${position}:?\\s*`, 'i'), '').trim();

  // Ensure proper punctuation
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += currentRound === totalRounds ? '!' : '.';
  }

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Add round-specific formatting
  if (currentRound === 1) {
    cleaned = cleaned.replace(/(\n•|\n\d\.?)/g, '\n$1'); // Ensure list formatting
  } else if (currentRound === totalRounds) {
    if (!cleaned.startsWith('Therefore') && !cleaned.startsWith('Thus')) {
      cleaned = `Therefore, ${cleaned.toLowerCase()}`;
    }
  }

  return cleaned;
}