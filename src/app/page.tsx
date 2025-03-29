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
    let turn: Speaker = 'A';
    const messages: {role: string, content: string}[] = [];

    for (let i = 0; i < responseCount * 2; i++) {
      try {
        messages.push({
          role: 'user',
          content: `${turn === 'A' ? 'Support this view:' : 'Critique this view:'} ${currentPrompt}`
        });

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
        
        setDebateLog(prev => [...prev, {
          speaker: turn,
          text: aiResponse,
          prompt: currentPrompt
        }]);
        
        currentPrompt = aiResponse;
        turn = turn === 'A' ? 'B' : 'A';
        
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">AI Debater</h1>
        
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <p className="text-sm text-gray-700 mb-4">Enter a debate topic or press 'Sample Topic' to get a random topic.</p>
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
                className="flex-1 p-3 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 w-full"
                placeholder="Enter a debate topic..."
              />
              <button
                onClick={generateSamplePrompt}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full md:w-auto"
              >
                Sample Topic
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="responseCount" className="block text-sm font-medium text-gray-800 mb-2">
              Responses per Side
            </label>
            <input
              type="number"
              id="responseCount"
              min="1"
              max="10"
              value={responseCount}
              onChange={(e) => setResponseCount(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="p-3 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 w-full"
            />
          </div>
          
          <button
            onClick={startDebate}
            disabled={isDebating || !prompt}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isDebating || !prompt ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition`}
          >
            {isDebating ? 'Debating...' : 'Start Debate'}
          </button>
        </div>
        
        {debateLog.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4">Debate Log</h2>
            <div className="space-y-4">
              {debateLog.map((entry, index) => (
                <div key={index} className={`p-3 rounded-md ${entry.speaker === 'A' ? 'bg-blue-100' : 'bg-green-100'}` }>
                  <p className="text-sm text-gray-700 mb-1 font-semibold">
                    {entry.speaker === 'A' ? 'DeepSeek A (Supportive)' : 'DeepSeek B (Critical)'}
                  </p>
                  <p className="text-gray-900">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
