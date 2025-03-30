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
    const debateEntries: DebateEntry[] = []; // Local buffer to maintain order

    for (let i = 0; i < responseCount * 2; i++) {
      const turn: Speaker = i % 2 === 0 ? 'A' : 'B'; // Math-based turn order
      const isSupportive = turn === 'A';
      
      try {
        // Build message history from local buffer
        const messages = debateEntries.map(entry => ({
          role: entry.speaker === turn ? 'assistant' : 'user',
          content: entry.speaker === turn 
            ? entry.text 
            : `${entry.speaker === 'A' ? 'Support:' : 'Critique:'} ${entry.prompt}`
        }));

        // Add current prompt
        messages.push({
          role: 'user',
          content: `${isSupportive ? 'Support this:' : 'Critique this:'} ${currentPrompt}`
        });

        // API call with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/debate', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personality: isSupportive ? 'supportive' : 'critical',
            messages,
            currentSpeaker: turn,
            debateTopic: prompt
          })
        });
        clearTimeout(timeout);

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Debate failed');
        }

        // Update local state
        const aiResponse = data.response;
        const newEntry = {
          speaker: turn,
          text: aiResponse,
          prompt: currentPrompt,
          isSurrender: data.isSurrender
        };
        
        debateEntries.push(newEntry);
        currentPrompt = aiResponse;
        
        // Update UI with current state
        setDebateLog([...debateEntries]);
        
        // Small delay between turns
        if (i < responseCount * 2 - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        const errorEntry = {
          speaker: turn,
          text: error instanceof Error ? error.message : 'Debate paused',
          prompt: currentPrompt,
          isSurrender: true
        };
        debateEntries.push(errorEntry);
        setDebateLog([...debateEntries]);
        break;
      }
    }
    
    setIsDebating(false);
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
              isDebating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition flex justify-center items-center`}
          >
            {isDebating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Debating...
              </>
            ) : 'Start Debate'}
          </button>
        </div>
        
        {debateLog.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Debate Transcript</h2>
            <div className="space-y-4">
              {debateLog.map((entry, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-md ${
                    entry.isSurrender 
                      ? 'bg-yellow-100 border-l-4 border-yellow-500'
                      : entry.speaker === 'A' 
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-green-50 border-l-4 border-green-500'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {entry.speaker === 'A' ? 'Supporting View (A)' : 'Opposing View (B)'}
                    {entry.isSurrender && ' (Conceded)'}
                  </p>
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}