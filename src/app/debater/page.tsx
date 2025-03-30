'use client';
import { useState } from 'react';
import DownloadDebateButton from './components/DownloadDebateButton';
import PrintDebateButton from './components/PrintDebateButton';

type Speaker = 'A' | 'B';
type DebateEntry = {
  speaker: Speaker;
  text: string;
  isSurrender?: boolean;
  round: number;
};

type DebateResult = {
  winner: 'PRO' | 'CON' | 'Draw';
  score: string;
  commentary: string;
  roundsWon: {
    pro: number;
    con: number;
  };
};

export default function DebateApp() {
  const [prompt, setPrompt] = useState('');
  const [responseCount, setResponseCount] = useState(3);
  const [isDebating, setIsDebating] = useState(false);
  const [debateLog, setDebateLog] = useState<DebateEntry[]>([]);
  const [isJudging, setIsJudging] = useState(false);
  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);

  const samplePrompts = [
    "Should universal basic income be implemented worldwide?",
    "Is artificial intelligence a net positive for humanity?",
    "Should college education be free for everyone?",
    "Does social media do more harm than good to society?",
    "Should humans prioritize space exploration over solving Earth's problems?"
  ];

  const generateSamplePrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };

  const startDebate = async () => {
    if (!prompt || responseCount < 1) return;
    
    setIsDebating(true);
    setDebateLog([]);
    setDebateResult(null);
    
    const debateEntries: DebateEntry[] = [];
    let speakerFlag: Speaker = 'A';
    let opponentSurrendered = false;

    try {
      for (let round = 1; round <= responseCount && !opponentSurrendered; round++) {
        for (let turn = 0; turn < 2 && !opponentSurrendered; turn++) {
          try {
            const opponentArguments = debateEntries
              .filter(entry => entry.speaker !== speakerFlag)
              .map(entry => entry.text);
            
            const ownArguments = debateEntries
              .filter(entry => entry.speaker === speakerFlag)
              .map(entry => entry.text);

            const lastOpponentEntry = debateEntries
              .filter(entry => entry.speaker !== speakerFlag)
              .slice(-1)[0];

            const response = await fetch('/api/debate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentSpeaker: speakerFlag,
                debateTopic: prompt,
                debateHistory: debateEntries.map(e => ({
                  speaker: e.speaker,
                  text: e.text
                })),
                currentRound: round,
                totalRounds: responseCount,
                lastOpponentText: lastOpponentEntry?.text || '',
                fullOpponentArguments: opponentArguments,
                fullOwnArguments: ownArguments
              }),
              signal: AbortSignal.timeout(25000)
            });

            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

            const data = await response.json();
            
            const newEntry: DebateEntry = {
              speaker: speakerFlag,
              text: data.response,
              isSurrender: data.isSurrender,
              round: round
            };

            debateEntries.push(newEntry);
            setDebateLog([...debateEntries]);
            
            if (data.isSurrender) {
              opponentSurrendered = true;
              break;
            }

            speakerFlag = speakerFlag === 'A' ? 'B' : 'A';
          } catch (error) {
            console.error('Debate error:', error);
            debateEntries.push({
              speaker: speakerFlag,
              text: 'Response failed. Please try again.',
              isSurrender: true,
              round: round
            });
            setDebateLog([...debateEntries]);
            opponentSurrendered = true;
          }
        }
      }
    } finally {
      setIsDebating(false);
    }
  };

  const judgeDebate = async () => {
    if (debateLog.length === 0) return;
    
    setIsJudging(true);
    try {
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateTopic: prompt,
          debateLog: debateLog,
          totalRounds: responseCount
        })
      });

      if (!response.ok) throw new Error('Judging failed');
      
      const result = await response.json();
      setDebateResult(result);
    } catch (error) {
      console.error('Judging error:', error);
      setDebateResult({
        winner: 'Draw',
        score: '0-0',
        commentary: 'Unable to determine a winner due to an error.',
        roundsWon: { pro: 0, con: 0 }
      });
    } finally {
      setIsJudging(false);
    }
  };

  const resetDebate = () => {
    setDebateLog([]);
    setPrompt('');
    setResponseCount(3);
    setDebateResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">AI Debate Arena</h1>
        
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-800 mb-2">
              Debate Topic
            </label>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                placeholder="Enter a debate topic..."
                disabled={isDebating}
              />
              <button
                onClick={generateSamplePrompt}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                disabled={isDebating}
              >
                Sample Topic
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="rounds" className="block text-sm font-medium text-gray-800 mb-2">
                Number of Rounds (1-5)
              </label>
              <input
                type="number"
                id="rounds"
                min="1"
                max="5"
                value={responseCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setResponseCount(Math.max(1, Math.min(5, value)));
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                disabled={isDebating}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetDebate}
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                disabled={isDebating}
              >
                Reset Debate
              </button>
            </div>
          </div>
  
          <div className="flex flex-col space-y-3">
            <button
              onClick={startDebate}
              disabled={isDebating || !prompt}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isDebating ? 'bg-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              } transition flex justify-center items-center`}
            >
              {isDebating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Debating...
                </>
              ) : 'Start Debate'}
            </button>

            {debateLog.length > 0 && !isDebating && (
             <>
              <button
                onClick={judgeDebate}
                disabled={isJudging}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isJudging ? 'bg-yellow-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
                } transition flex justify-center items-center text-white`}
              >
                {isJudging ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Judging...
                  </>
                ) : 'Judge the Debate'}
              </button>
              <DownloadDebateButton
                debateLog={debateLog}
                prompt={prompt}
                responseCount={responseCount}
                debateResult={debateResult}
              />
               <PrintDebateButton 
                debateLog={debateLog}
                prompt={prompt}
                responseCount={responseCount}
                debateResult={debateResult}
                />
            </>
            )}
          </div>
        </div>
        
        {debateResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Debate Results</h2>
            <div className={`p-4 rounded-lg mb-4 ${
              debateResult.winner === 'PRO' ? 'bg-blue-50 border-l-4 border-blue-600' :
              debateResult.winner === 'CON' ? 'bg-red-50 border-l-4 border-red-600' :
              'bg-gray-50 border-l-4 border-gray-600'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">
                  Winner: {debateResult.winner}
                </span>
                <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm font-medium">
                  Score: {debateResult.score}
                </span>
              </div>
              {debateResult.roundsWon && (
                <div className="mt-2 text-sm text-gray-600">
                  PRO won {debateResult.roundsWon.pro} rounds, CON won {debateResult.roundsWon.con} rounds
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Judge&apos;s Commentary:</h3>
              <p className="whitespace-pre-wrap text-gray-700">{debateResult.commentary}</p>
            </div>
          </div>
        )}

        {debateLog.length > 0 && (
          <div className="mt-6 space-y-4">
            {debateLog.map((entry, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  entry.isSurrender ? 'border-yellow-600 bg-yellow-100' :
                  entry.speaker === 'A' ? 'border-blue-600 bg-blue-100' : 'border-red-600 bg-red-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium text-sm ${
                    entry.isSurrender ? 'text-yellow-800' :
                    entry.speaker === 'A' ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {entry.speaker === 'A' ? 'PRO Side' : 'CON Side'}
                    {entry.isSurrender && ' (Conceded)'}
                  </span>
                  <span className="text-xs text-gray-600">
                    Round {entry.round} of {responseCount}
                  </span>
                </div>
                <p className={`whitespace-pre-wrap ${
                  entry.isSurrender ? 'text-yellow-900' :
                  entry.speaker === 'A' ? 'text-blue-900' : 'text-red-900'
                }`}>{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}