//page.tsx
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

    for (let i = 0; i < responseCount; i++) {
      for (let j = 0; j < 2; j++) { // Ensures each round has two turns (A & B)
        let responseReceived = false;
        
        while (!responseReceived) {
          try {
            const messages = debateEntries.flatMap((entry) => [
              { role: 'user', content: `${entry.speaker === 'A' ? 'Support:' : 'Critique:'} ${entry.prompt}` },
              { role: 'assistant', content: entry.text }
            ]);

            messages.push({ role: 'user', content: `${speakerFlag === 'A' ? 'Support this:' : 'Critique this:'} ${currentPrompt}` });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch('/api/debate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                currentSpeaker: speakerFlag,
                debateTopic: prompt,
                messages,
                debateHistory: debateEntries.map(e => `${e.speaker === 'A' ? '[PRO]' : '[CON]'} ${e.text}`)
              })
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Debate failed');

            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Debate failed');

            debateEntries.push({ speaker: speakerFlag, text: data.response, prompt: currentPrompt });
            setDebateLog([...debateEntries]);
            currentPrompt = data.response;
            responseReceived = true;
          } catch (error) {
            debateEntries.push({
              speaker: speakerFlag,
              text: 'Response timed out or failed.',
              prompt: currentPrompt,
              isSurrender: true
            });
            setDebateLog([...debateEntries]);
            responseReceived = true;
          }
        }

        speakerFlag = speakerFlag === 'A' ? 'B' : 'A';
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
          
          <button
            onClick={startDebate}
            disabled={isDebating || !prompt}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isDebating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition flex justify-center items-center`}
          >
            {isDebating ? 'Debating...' : 'Start Debate'}
          </button>
        </div>
        
        {debateLog.length > 0 && (
          <div className="mt-6 space-y-4">
            {debateLog.map((entry, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                entry.isSurrender ? 'border-yellow-500 bg-yellow-50' :
                entry.speaker === 'A' ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'
              }`}>
                <p className="font-medium text-sm mb-1">
                  {entry.speaker === 'A' ? 'PRO Side' : 'CON Side'}
                  {entry.isSurrender && ' (Conceded)'}
                </p>
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
