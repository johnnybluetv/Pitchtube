import React from 'react';
import { UserPlus, MessageSquare, Zap } from 'lucide-react';

const activities = [
  { id: 1, user: 'Andreessen H.', action: 'viewed your 3m pitch', time: '2m ago', icon: Zap },
  { id: 2, user: 'Sarah Chen (Angel)', action: 'requested a deck', time: '14m ago', icon: MessageSquare },
  { id: 3, user: 'Sequioa Cap', action: 'added you to "Hot List"', time: '1h ago', icon: UserPlus },
];

export function DealFlowFeed() {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Live Deal Flow</h3>
      {activities.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-800/50 rounded-lg hover:border-zinc-700 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
              item.id === 1 ? 'bg-blue-500 text-blue-500' : 
              item.id === 2 ? 'bg-orange-500 text-orange-500' : 
              'bg-emerald-500 text-emerald-500'
            }`}></div>
            <span className="text-xs">
              <span className="font-bold text-white">{item.user}</span> 
              <span className="text-zinc-400 ml-1">{item.action}</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-600 uppercase">{item.time}</span>
        </div>
      ))}
    </div>
  );
}
