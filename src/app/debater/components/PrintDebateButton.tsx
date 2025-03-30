'use client';

import { useRouter } from 'next/navigation';

interface PrintDebateButtonProps {
  debateLog: {
    speaker: 'A' | 'B';
    text: string;
    isSurrender?: boolean;
    round: number;
  }[];
  prompt: string;
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
}

export default function PrintDebateButton({
  debateLog,
  prompt,
  responseCount,
  debateResult
}: PrintDebateButtonProps) {
  const router = useRouter();

  const generatePrintView = () => {
    if (!debateLog.length) return;

    // Store the debate data in sessionStorage
    const printData = {
      prompt,
      debateLog,
      responseCount,
      debateResult,
      timestamp: new Date().toLocaleString()
    };
    sessionStorage.setItem('printDebateData', JSON.stringify(printData));

    // Open in new tab
    window.open('/debater/print', '_blank');
  };

  if (!debateLog.length) return null;

  return (
    <button
      onClick={generatePrintView}
      className="w-full py-3 px-4 rounded-md font-medium bg-purple-600 hover:bg-purple-700 transition text-white"
    >
      Print-Friendly View
    </button>
  );
}