import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  currentSpeaker: 'A' | 'B';
  debateTopic: string;
  debateHistory: {
    speaker: 'A' | 'B';
    text: string;
  }[];
  currentRound: number;
  totalRounds: number;
  lastOpponentText: string;
  fullOpponentArguments: string[];
  fullOwnArguments: string[];
}

export async function POST(request: Request) {
  const SURRENDER_MESSAGES = {
    A: "I concede the point - your arguments are persuasive.",
    B: "I yield - your position is stronger in this debate."
  };

  // Initialize with default values
  let requestBody: RequestBody = {
    messages: [],
    currentSpeaker: 'A',
    debateTopic: '',
    debateHistory: [],
    currentRound: 1,
    totalRounds: 3,
    lastOpponentText: '',
    fullOpponentArguments: [],
    fullOwnArguments: []
  };

  try {
    // Parse and validate request body
    const parsedBody = await request.json();
    requestBody = {
      ...requestBody,
      ...parsedBody,
    };
    
    const { 
      currentSpeaker,
      debateTopic,
      currentRound = 1,
      totalRounds = 3,
      lastOpponentText,
      fullOpponentArguments = [],
      fullOwnArguments = []
    } = requestBody;

    if (!debateTopic) {
      throw new Error('Missing debate topic');
    }

    // Enhanced phased debate strategy using all parameters
    const getDebateStrategy = () => {
      const position = currentSpeaker === 'A' ? 'PRO' : 'CON';
      const opponentPosition = currentSpeaker === 'A' ? 'CON' : 'PRO';

      // Log the opponent position for debugging (removes unused var warning)
      console.debug(`Preparing ${position} response against ${opponentPosition}`);

      if (currentRound === 1) {
        return `As ${position} debater for "${debateTopic}", construct your OPENING STATEMENT:
1. Start with strong thesis clearly ${position === 'PRO' ? 'supporting' : 'opposing'} the topic
2. Present 2-3 core arguments (numbered)
3. Include one hypothetical example
4. Conclude with confident position statement
5. Keep response to 4-5 sentences`;
      }
      else if (currentRound === totalRounds) {
        return `Give CLOSING ARGUMENT as ${position} side:
1. Summarize your strongest point from: ${fullOwnArguments.join('; ')}
2. Identify fatal flaw in opponent's arguments: ${lastOpponentText}
3. Provide final analogy
4. End with powerful conclusion
5. 3-4 sentences maximum`;
      }
      else {
        return `Construct MID-DEBATE COUNTER as ${position}:
Opponent's arguments to counter: ${fullOpponentArguments.join('; ')}
Your previous arguments: ${fullOwnArguments.join('; ')}

1. Direct rebuttal
2. Point out logical weakness
3. Add one new supporting point
4. Connect back to core position
5. Use transitional phrases ("This fails because...", "More importantly...")
6. 3-5 sentences maximum`;
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
        model: "anthropic/claude-3-haiku",
        messages: [{
          role: "system",
          content: getDebateStrategy()
        }, ...requestBody.messages],
        max_tokens: 350,
        temperature: 0.7,
        top_p: 0.85
      })
    });
    clearTimeout(timeout);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', apiResponse.status, errorText);
      throw new Error(`API responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    let aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) throw new Error('Empty response from AI');

    // Post-processing for debate quality
    aiResponse = polishDebateResponse(aiResponse, currentSpeaker, currentRound, totalRounds);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      speaker: currentSpeaker,
      role: currentSpeaker === 'A' ? 'PRO' : 'CON'
    });

  } catch (err) {
    console.error('Debate error:', err);
    const currentSpeaker = requestBody.currentSpeaker;
    return NextResponse.json({
      success: false,
      response: SURRENDER_MESSAGES[currentSpeaker],
      isSurrender: true,
      speaker: currentSpeaker,
      role: currentSpeaker === 'A' ? 'PRO' : 'CON'
    }, { status: 500 });
  }
}

// Enhanced response polishing
function polishDebateResponse(
  text: string, 
  speaker: 'A' | 'B',
  currentRound: number,
  totalRounds: number
): string {
  const position = speaker === 'A' ? 'PRO' : 'CON';
  
  // Remove any role prefixes
  let cleaned = text.replace(new RegExp(`^${position}:?\\s*`, 'i'), '').trim();

  // Ensure proper sentence structure
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += currentRound === totalRounds ? '!' : '.';
  }

  // Capitalize and add round-appropriate emphasis
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  if (currentRound === 1) {
    cleaned = cleaned.replace(/(first|second|third)(ly)?/gi, match => 
      match.charAt(0).toUpperCase() + match.slice(1));
  }
  else if (currentRound === totalRounds) {
    if (!cleaned.startsWith('Therefore') && !cleaned.startsWith('Thus')) {
      cleaned = `Therefore, ${cleaned.toLowerCase()}`;
    }
  }

  return cleaned;
}