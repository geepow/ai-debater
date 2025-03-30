'use client';
import { useState } from 'react';

type Speaker = 'A' | 'B';
type DebateEntry = {
  speaker: Speaker;
  text: string;
  isSurrender?: boolean;
  round: number;
};

export default function DebateApp() {
  const [prompt, setPrompt] = useState('');
  const [responseCount, setResponseCount] = useState(3);
  const [isDebating, setIsDebating] = useState(false);
  const [debateLog, setDebateLog] = useState<DebateEntry[]>([]);

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
    
    const debateEntries: DebateEntry[] = [];
    let speakerFlag: Speaker = 'A';
    let opponentSurrendered = false;

    try {
      for (let round = 1; round <= responseCount && !opponentSurrendered; round++) {
        for (let turn = 0; turn < 2 && !opponentSurrendered; turn++) {
          try {
            // Get all previous arguments from both sides
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
              signal: AbortSignal.timeout(25000) // 25s timeout per request
            });

            if (!response.ok) {
              throw new Error(`Request failed with status ${response.status}`);
            }

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

            speakerFlag = speakerFlag === 'A' ? 'B' : 'A'; // Alternate speakers
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

  const resetDebate = () => {
    setDebateLog([]);
    setPrompt('');
    setResponseCount(3);
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
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
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
  
          <button
            onClick={startDebate}
            disabled={isDebating || !prompt}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isDebating ? 'bg-blue-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
        </div>
        
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