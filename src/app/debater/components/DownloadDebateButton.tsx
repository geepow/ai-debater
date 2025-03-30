'use client';

interface DownloadDebateButtonProps {
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

export default function DownloadDebateButton({
  debateLog,
  prompt,
  responseCount,
  debateResult
}: DownloadDebateButtonProps) {
  const downloadDebate = () => {
    if (!debateLog.length) return;

    // Format with markdown-style headers
    const debateTranscript = debateLog.map(entry => {
      const speaker = entry.speaker === 'A' ? 'PRO' : 'CON';
      const roundInfo = `Round ${entry.round}/${responseCount}`;
      const surrenderMark = entry.isSurrender ? ' *(Conceded)*' : '';
      return `### ${speaker} (${roundInfo})${surrenderMark}\n\n${entry.text}\n`;
    }).join('\n');

    const resultsSection = debateResult ? 
      `## Debate Results\n
**Winner:** ${debateResult.winner}  
**Score:** ${debateResult.score}  
**Rounds Won:** PRO ${debateResult.roundsWon.pro} - CON ${debateResult.roundsWon.con}\n
### Judge's Commentary\n
${debateResult.commentary}\n` : 
      '\n## (No judgment recorded yet)\n';

    const fullContent = `# AI Debate Transcript\n
**Topic:** ${prompt || 'Untitled debate'}  
**Date:** ${new Date().toLocaleString()}\n
## Debate Log\n
${debateTranscript}
${resultsSection}`;

    // Create download
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!debateLog.length) return null;

  return (
    <button
      onClick={downloadDebate}
      className="w-full py-3 px-4 rounded-md font-medium bg-green-600 hover:bg-green-700 transition text-white"
    >
      Download Debate
    </button>
  );
}