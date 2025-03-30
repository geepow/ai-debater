import { NextResponse } from 'next/server';

interface JudgeRequest {
  debateTopic: string;
  debateLog: {
    speaker: 'A' | 'B';
    text: string;
    isSurrender?: boolean;
    round: number;
  }[];
  totalRounds: number;
}

export async function POST(request: Request) {
  // 1. Parse and validate request
  let requestData: JudgeRequest;
  try {
    requestData = await request.json();
    if (!requestData.debateTopic || !requestData.debateLog) {
      throw new Error('Missing required fields');
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }

  const { debateTopic, debateLog, totalRounds } = requestData;

  // 2. Prepare debate transcript for analysis
  const buildDebateTranscript = () => {
    return debateLog.map(entry => {
      const speaker = entry.speaker === 'A' ? 'PRO' : 'CON';
      const roundInfo = `(Round ${entry.round}/${totalRounds})`;
      const surrenderMark = entry.isSurrender ? ' [CONCEDED]' : '';
      return `${speaker} ${roundInfo}: ${entry.text}${surrenderMark}`;
    }).join('\n\n');
  };

  // 3. Generate judging instructions with strict JSON format requirement
  const systemPrompt = `You are an expert debate judge analyzing this debate about: "${debateTopic}".

  Debate Transcript:
  ${buildDebateTranscript()}

  Provide your judgment in the following EXACT JSON format (NO markdown, NO code blocks, ONLY pure JSON):

  {
    "winner": "PRO" | "CON" | "Draw",
    "score": "X-Y" (X=PRO rounds won, Y=CON rounds won),
    "commentary": "Detailed analysis of the debate outcome",
    "roundsWon": {
      "pro": number,
      "con": number
    }
  }

  Rules:
  1. Must output ONLY the JSON object, nothing else
  2. Do not wrap in markdown code blocks
  3. Do not include any additional text
  4. Ensure proper JSON formatting with double quotes`;

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 90000); // 45s timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-debater-gee-pows-projects.vercel.app/'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{
          role: "system",
          content: systemPrompt
        }],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    let judgment = data.choices?.[0]?.message?.content;
    
    if (!judgment) throw new Error('Empty judgment response');

    // Clean the response if it contains markdown code blocks
    if (judgment.startsWith('```json')) {
      judgment = judgment.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (judgment.startsWith('```')) {
      judgment = judgment.replace(/```/g, '').trim();
    }

    // Parse the cleaned JSON
    const parsedJudgment = JSON.parse(judgment);
    
    // Validate the judgment structure
    if (!['PRO', 'CON', 'Draw'].includes(parsedJudgment.winner)) {
      throw new Error('Invalid winner declaration');
    }

    // Check score format
    if (!parsedJudgment.score || !/\d+-\d+/.test(parsedJudgment.score)) {
      throw new Error('Invalid score format');
    }

    // Check for concession
    const hasConcession = debateLog.some(entry => entry.isSurrender);
    if (hasConcession) {
      const concedingSide = debateLog.find(entry => entry.isSurrender)?.speaker === 'A' ? 'PRO' : 'CON';
      return NextResponse.json({
        winner: concedingSide === 'PRO' ? 'CON' : 'PRO',
        score: concedingSide === 'PRO' ? `0-${totalRounds}` : `${totalRounds}-0`,
        commentary: `The ${concedingSide} side conceded the debate, automatically awarding victory to their opponent.`,
        roundsWon: {
          pro: concedingSide === 'PRO' ? 0 : totalRounds,
          con: concedingSide === 'CON' ? 0 : totalRounds
        }
      });
    }

    return NextResponse.json(parsedJudgment);

  } catch (error: unknown) {
    const usedError = error instanceof Error ? error.message : String(error);
    console.error('Judging error:', usedError);
    
    // Fallback judgment
    return NextResponse.json({
      winner: "Draw",
      score: "0-0",
      commentary: "The judge was unable to determine a clear winner due to technical difficulties.",
      roundsWon: {
        pro: 0,
        con: 0
      }
    }, { status: 500 });
  }
}