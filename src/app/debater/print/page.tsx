'use client';

import { useEffect, useState } from 'react';

interface PrintDebateData {
  prompt: string;
  debateLog: {
    speaker: 'A' | 'B';
    text: string;
    isSurrender?: boolean;
    round: number;
  }[];
  responseCount: number;
  debateResult: {
    winner: string;
    score: string;
    commentary: string;
    roundsWon: {
      pro: number;
      con: number;
    };
  } | null;
  timestamp: string;
}

export default function PrintDebatePage() {
  const [debateData, setDebateData] = useState<PrintDebateData | null>(null);

  const handlePrint = () => {
    const printContents = document.getElementById('printable-content');
    const originalContents = document.body.innerHTML;
    
    if (printContents) {
      document.body.innerHTML = printContents.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem('printDebateData');
      if (data) {
        setDebateData(JSON.parse(data));
        sessionStorage.removeItem('printDebateData');
      }
    }
  }, []);

  if (!debateData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No debate data found</h1>
          <p className="text-gray-600">Please generate a debate first before trying to print.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0">
      {/* Non-printable header with print button */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Transcript
        </button>
      </div>

      {/* Printable content */}
      <div id="printable-content" className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        {/* Debate Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white print:break-after-avoid">
          <h1 className="text-3xl font-bold mb-2">AI Debate Transcript</h1>
          <p className="text-indigo-100">Topic: {debateData.prompt}</p>
          <p className="text-indigo-100 text-sm mt-2">Generated: {debateData.timestamp}</p>
        </div>

        {/* Debate Log */}
        <div className="p-6 print:p-4">
          {debateData.debateLog.map((entry, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 mb-4 print:break-inside-avoid ${
                entry.isSurrender ? 'border-yellow-500 bg-yellow-50' :
                entry.speaker === 'A' ? 'border-blue-500 bg-blue-50' : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-medium ${
                  entry.isSurrender ? 'text-yellow-700' :
                  entry.speaker === 'A' ? 'text-blue-700' : 'text-red-700'
                }`}>
                  {entry.speaker === 'A' ? 'PRO Side' : 'CON Side'}
                  {entry.isSurrender && ' (Conceded)'}
                </span>
                <span className="text-xs text-gray-500">
                  Round {entry.round} of {debateData.responseCount}
                </span>
              </div>
              <p className={`mt-2 whitespace-pre-wrap ${
                entry.isSurrender ? 'text-yellow-800' :
                entry.speaker === 'A' ? 'text-blue-800' : 'text-red-800'
              }`}>{entry.text}</p>
            </div>
          ))}
        </div>

        {/* Results */}
        {debateData.debateResult && (
          <div className="p-6 bg-gray-50 border-t border-gray-200 print:break-before-page">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Debate Results</h2>
            <div className={`p-4 rounded-lg mb-4 ${
              debateData.debateResult.winner === 'PRO' ? 'bg-blue-50 border-l-4 border-blue-500' :
              debateData.debateResult.winner === 'CON' ? 'bg-red-50 border-l-4 border-red-500' :
              'bg-gray-100 border-l-4 border-gray-500'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">
                  Winner: {debateData.debateResult.winner}
                </span>
                <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm font-medium">
                  Score: {debateData.debateResult.score}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                PRO won {debateData.debateResult.roundsWon.pro} rounds, CON won {debateData.debateResult.roundsWon.con} rounds
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Judge's Commentary:</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap text-gray-700">{debateData.debateResult.commentary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Printable footer */}
        <div className="p-4 bg-gray-100 text-center text-xs text-gray-600 border-t border-gray-200 print:block">
          <p>Generated by AI Debate Arena • aidebatearena.com</p>
        </div>
      </div>
    </div>
  );
}