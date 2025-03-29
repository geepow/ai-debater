'use client';
import { useState } from 'react';

type Speaker = 'A' | 'B';
type DebateEntry = {
  speaker: Speaker;
  text: string;
  prompt: string;
};

export default function DebateApp() {
  const [prompt, setPrompt] = useState('');
  const [responseCount, setResponseCount] = useState(3);
  const [isDebating, setIsDebating] = useState(false);
  const [debateLog, setDebateLog] = useState<DebateEntry[]>([]);
  
  const randomPrompts = [
    "Is artificial intelligence a net positive for humanity?",
    "Should college education be free for everyone?",
    "Does social media do more harm than good to society?",
    "Should humans prioritize space exploration over solving Earth's problems?",
    "Is universal basic income a viable solution for future economies?"
  ];

  const generateRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
  };

  const startDebate = async () => {
    if (!prompt || responseCount < 1) return;
    
    setIsDebating(true);
    setDebateLog([]);
    
    let currentPrompt = prompt;
    let turn: Speaker = 'A';
    const messages: {role: string, content: string}[] = [];

    for (let i = 0; i < responseCount * 2; i++) {
      try {
        // Add user message to history
        messages.push({
          role: 'user',
          content: `${turn === 'A' ? 'Support this view:' : 'Critique this view:'} ${currentPrompt}`
        });

        // Call your protected API route
        const response = await fetch('/api/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality: turn === 'A' ? 'supportive' : 'critical',
            messages
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Debate failed');
        }

        const aiResponse = data.response;
        
        // Update debate log
        setDebateLog(prev => [...prev, {
          speaker: turn,
          text: aiResponse,
          prompt: currentPrompt
        }]);
        
        // Prepare for next turn
        currentPrompt = aiResponse;
        turn = turn === 'A' ? 'B' : 'A';
        
        // Add AI response to history
        messages.push({
          role: 'assistant',
          content: aiResponse
        });
        
      } catch (error) {
        console.error('Debate Error:', error);
        setDebateLog(prev => [...prev, {
          speaker: turn,
          text: error instanceof Error ? error.message : 'Debate paused',
          prompt: currentPrompt
        }]);
        break;
      }
    }
    
    setIsDebating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">AI Debate Simulator</h1>
        
        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Debate Topic
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a debate topic..."
              />
              <button
                onClick={generateRandomPrompt}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Random Prompt
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="responseCount" className="block text-sm font-medium text-gray-700 mb-2">
              Responses per Side
            </label>
            <input
              type="number"
              id="responseCount"
              min="1"
              max="10"
              value={responseCount}
              onChange={(e) => setResponseCount(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={startDebate}
            disabled={isDebating || !prompt}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isDebating || !prompt ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            {isDebating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Debating...
              </span>
            ) : 'Start Debate'}
          </button>
        </div>
        
        {/* Debate Display */}
        {debateLog.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debate Log</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column A - Supportive */}
              <div className="border-r md:border-r-0 md:border-b pb-4 md:pb-0 md:pr-4">
                <h3 className="text-lg font-medium text-blue-600 mb-2">DeepSeek A (Supportive)</h3>
                <div className="space-y-4">
                  {debateLog
                    .filter((_, index) => index % 2 === 0) // Even indexes are Speaker A
                    .map((entry, turnIndex) => (
                      <div key={`A-${turnIndex}`} className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-600 mb-1">Global Turn {turnIndex * 2 + 1}</p>
                        <p className="whitespace-pre-wrap">{entry.text}</p>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Column B - Critical */}
              <div className="pt-4 md:pt-0 md:pl-4">
                <h3 className="text-lg font-medium text-green-600 mb-2">DeepSeek B (Critical)</h3>
                <div className="space-y-4">
                  {debateLog
                    .filter((_, index) => index % 2 === 1) // Odd indexes are Speaker B
                    .map((entry, turnIndex) => (
                      <div key={`B-${turnIndex}`} className="p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-gray-600 mb-1">Global Turn {turnIndex * 2 + 2}</p>
                        <p className="whitespace-pre-wrap">{entry.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}