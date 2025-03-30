'use client';
import { useState } from 'react';

type Speaker = 'A' | 'B';
type DebateEntry = {
  speaker: Speaker;
  text: string;
  prompt: string;
  isSurrender?: boolean;
};

export default function DebateApp() {
  const [prompt, setPrompt] = useState('');
  const [responseCount, setResponseCount] = useState(3);
  const [isDebating, setIsDebating] = useState(false);
  const [debateLog, setDebateLog] = useState<DebateEntry[]>([]);

  const samplePrompts = [
    "Is artificial intelligence a net positive for humanity?",
    "Should college education be free for everyone?",
    "Does social media do more harm than good to society?",
    "Should humans prioritize space exploration over solving Earth's problems?",
    "Is universal basic income a viable solution for future economies?"
  ];

  const generateSamplePrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };

  const startDebate = async () => {
    if (!prompt || responseCount < 1) return;
    
    setIsDebating(true);
    setDebateLog([]);
    
    let currentPrompt = prompt;
    const debateEntries: DebateEntry[] = [];
    let speakerFlag: Speaker = 'A';
    let opponentSurrendered = false;
    let errorOccurred = false;

    try {
      // Each round consists of two turns (A and B)
      for (let round = 1; round <= responseCount && !opponentSurrendered && !errorOccurred; round++) {
        for (let turn = 0; turn < 2 && !opponentSurrendered && !errorOccurred; turn++) {
          try {
            const response = await fetch('/api/debate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentSpeaker: speakerFlag,
                debateTopic: prompt,
                messages: debateEntries.map(entry => ({
                  role: 'assistant',
                  content: entry.text
                })),
                debateHistory: debateEntries.map(e => e.text),
                currentRound: round,
                totalRounds: responseCount,
                opponentSurrendered: opponentSurrendered
              }),
              signal: AbortSignal.timeout(20000) // 20s timeout per request
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            const newEntry: DebateEntry = {
              speaker: speakerFlag,
              text: data.response,
              prompt: currentPrompt,
              isSurrender: data.isSurrender
            };

            debateEntries.push(newEntry);
            setDebateLog([...debateEntries]);
            
            // If someone surrenders, end the debate immediately
            if (data.isSurrender) {
              opponentSurrendered = true;
              break;
            }

            currentPrompt = data.response;
            speakerFlag = speakerFlag === 'A' ? 'B' : 'A'; // Alternate speakers
            
          } catch (error) {
            console.error('Debate error:', error);
            debateEntries.push({
              speaker: speakerFlag,
              text: 'Response timed out or failed.',
              prompt: currentPrompt,
              isSurrender: true
            });
            setDebateLog([...debateEntries]);
            errorOccurred = true;
          }
        }
      }
    } finally {
      setIsDebating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">AI Debate Arena</h1>
        
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Debate Topic
            </label>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a debate topic..."
              />
              <button
                onClick={generateSamplePrompt}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Sample Topic
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="responses" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds (1-5)
            </label>
            <input
              type="number"
              id="responses"
              min="1"
              max="5"
              value={responseCount}
              onChange={(e) => setResponseCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={startDebate}
            disabled={isDebating || !prompt}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isDebating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
                  entry.isSurrender ? 'border-yellow-500 bg-yellow-50' :
                  entry.speaker === 'A' ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm mb-1">
                    {entry.speaker === 'A' ? 'PRO Side' : 'CON Side'}
                    {entry.isSurrender && ' (Conceded)'}
                  </p>
                  <span className="text-xs text-gray-500">
                    Round {Math.ceil((index + 1) / 2)} of {responseCount}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}