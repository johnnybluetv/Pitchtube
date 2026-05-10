import React from 'react';

const metrics = [
  { label: 'Problem Clarity', score: 85 },
  { label: 'Market Opportunity', score: 92 },
  { label: 'Team Credibility', score: 78 },
  { label: 'Pitch Energy', score: 95 },
];

export function PitchScorecard() {
  return (
    <div className="bg-zinc-900/20 border-2 border-orange-500/30 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 bg-orange-500/10 text-orange-500 text-[9px] font-bold tracking-widest uppercase">AI Shredder Active</div>
      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
        Intelligence Report
      </h3>
      <div className="space-y-6">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between text-[11px] mb-2 uppercase font-mono tracking-wider">
              <span className="text-zinc-400">{metric.label}</span>
              <span className="text-orange-400">{metric.score}/100</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                style={{ width: `${metric.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
         <p className="text-[10px] font-mono text-red-400 italic uppercase">Critical Feedback: Over-reliance on OpenAI API for core logic. Scalability at scale is high-risk.</p>
      </div>

      <button className="cyber-button w-full mt-6 !text-[10px] !font-black !bg-white !text-black hover:!bg-zinc-200 uppercase tracking-widest">
        DOWNLOAD INVESTOR BRIEF
      </button>
    </div>
  );
}
