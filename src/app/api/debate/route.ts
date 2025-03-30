import { NextResponse } from 'next/server';
// List of available free models with fallback priority
// const FREE_MODELS = [
//   "meta-llama/llama-3-70b-instruct",  // Free on OpenRouter
//   "google/gemma-7b-it",                // Free lightweight model
//   "mistralai/mistral-7b-instruct",     // Good fallback option
//   "anthropic/claude-3-haiku",          // Free tier available
//   "gryphe/mythomax-l2-13b"             // Another free option
// ];

interface DebateRequest {
  currentSpeaker: 'A' | 'B';
  debateTopic: string;
  debateHistory: {
    speaker: 'A' | 'B';
    text: string;
  }[];
  currentRound: number;
  totalRounds: number;
  lastOpponentText: string;
  fullOpponentArguments: string[]; // Track all opponent points
  fullOwnArguments: string[]; // Track all own points
}

export async function POST(request: Request) {
  // 1. Parse and validate request
  let requestData: DebateRequest;
  try {
    requestData = await request.json();
    if (!requestData.debateTopic || !requestData.currentSpeaker) {
      throw new Error('Missing required fields');
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }

  const {
    currentSpeaker,
    debateTopic,
  //  debateHistory = [],
    currentRound = 1,
    totalRounds = 3,
  //  lastOpponentText = '',
    fullOpponentArguments = [],
    fullOwnArguments = []
  } = requestData;

  // 2. Strict role enforcement
  const isPro = currentSpeaker === 'A';
  const position = isPro ? 'PRO' : 'CON';
  const opponentPosition = isPro ? 'CON' : 'PRO';

  // 3. Generate phase-specific instructions with full context
  const getSystemPrompt = () => {
    const buildArgumentList = (args: string[]) => 
      args.map((arg, i) => `${i+1}. ${arg}`).join('\n');

    // Opening statement
    if (currentRound === 1) {
      return `You are the ${position} side in a debate about: "${debateTopic}". 
      Present your OPENING ARGUMENT with:
      1. Clear position statement
      2. 2-3 original supporting points
      3. 1 concrete example
      4. Confident conclusion
      (Maintain strict ${position} position, 4-5 sentences)`;
    }

    // Rebuttal phase - now with full context
    if (currentRound > 1 && currentRound < totalRounds) {
      return `You are the ${position} side COUNTERING these ${opponentPosition} arguments:
      ${buildArgumentList(fullOpponentArguments)}
      
      Your previous arguments were:
      ${buildArgumentList(fullOwnArguments)}
      
      Your response MUST:
      1. Directly counter at least 2 ${opponentPosition} points
      2. Strengthen 1 of your previous arguments
      3. Add 1 new supporting point
      4. Never repeat ${opponentPosition}'s language verbatim
      5. Use clear opposition markers ("This fails because...", "They overlook...")
      
      (4-5 sentences, maintain strict ${position} stance)`;
    }

    // Closing argument
    return `You are the ${position} side giving your FINAL ARGUMENT.
    Opponent's key points:
    ${buildArgumentList(fullOpponentArguments)}
    
    Your key points:
    ${buildArgumentList(fullOwnArguments)}
    
    Your closing MUST:
    1. Summarize your strongest 2 points
    2. Identify fatal flaws in 2 opponent arguments
    3. End with powerful conclusion
    (3-4 sentences, decisive tone)`;
  };

  // 4. API Call with strict context enforcement
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{
          role: "system",
          content: getSystemPrompt()
        }],
        max_tokens: 350,
        temperature: 0.7,
        response_format: { type: "text" }
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) throw new Error('Empty response');

    // 5. Strict response validation and formatting
    aiResponse = aiResponse
      .replace(new RegExp(`^${position}:?\\s*`, 'i'), '')
      .trim();

    // Ensure proper opposition in rebuttals
    if (currentRound > 1 && currentRound < totalRounds) {
      const oppositionMarkers = [
        'however', 'but', 'fail', 'flaw', 'overlook', 
        'counter', 'misunderstand', 'ignore', 'contradict'
      ];
      if (!oppositionMarkers.some(m => aiResponse.toLowerCase().includes(m))) {
        aiResponse = `However, ${aiResponse.toLowerCase()}`;
      }
    }

    // Ensure proper closing structure
    if (currentRound === totalRounds) {
      if (!aiResponse.toLowerCase().startsWith('in conclusion') && 
          !aiResponse.toLowerCase().startsWith('therefore')) {
        aiResponse = `In conclusion, ${aiResponse.toLowerCase()}`;
      }
    }

    if (!/[.!?]$/.test(aiResponse)) {
      aiResponse += currentRound === totalRounds ? '!' : '.';
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.charAt(0).toUpperCase() + aiResponse.slice(1),
      speaker: currentSpeaker,
      role: position
    });

  } catch (error: unknown) {
    // Force ESLint to recognize usage
    const usedError = error instanceof Error ? error.message : String(error);
    console.error('Debate error:', usedError);
    return NextResponse.json({
      success: false,
      message: usedError, // Explicitly use the error
      response: isPro 
        ? "I concede - your arguments are persuasive." 
        : "I yield - your position is stronger.",
      isSurrender: true,
      speaker: currentSpeaker,
      role: position
    }, { status: 500 });
  }
}