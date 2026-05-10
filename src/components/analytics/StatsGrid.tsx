import React from 'react';
import { Flame, Eye, Handshake, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Burns', value: '1,284', icon: Flame, color: 'text-orange-500' },
  { label: 'Pitch Views', value: '12.4k', icon: Eye, color: 'text-blue-400' },
  { label: 'Investor Intros', value: '18', icon: Handshake, color: 'text-emerald-400' },
  { label: 'Momentum Score', value: '92%', icon: TrendingUp, color: 'text-purple-400' },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{stat.label.replace(' ', '_')}</span>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
