import React, { useEffect, useState } from 'react';
import { Flame, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

const mockTrending = [
  { id: '1', company_name: 'Nexus AI', founder_name: 'Alex Rivera', burn_count: 852, thumbnail_url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=100' },
  { id: '2', company_name: 'Quantum Health', founder_name: 'Dr. Sarah Smith', burn_count: 642, thumbnail_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=100' },
  { id: '3', company_name: 'SolarChain', founder_name: 'Mark Weber', burn_count: 521, thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=100' },
];

export function TrendingLeaderboard() {
  const [trending, setTrending] = useState(mockTrending);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Hottest Deals
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
          <TrendingUp className="w-3 h-3" />
          LIVE VELOCITY
        </div>
      </div>

      <div className="space-y-4">
        {trending.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group"
          >
            <div className="text-2xl font-black italic text-zinc-700 group-hover:text-orange-500 transition-colors w-8">
              #{index + 1}
            </div>
            
            <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden border border-zinc-700">
              <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold leading-tight group-hover:text-orange-400 transition-colors">{item.company_name}</h4>
              <p className="text-xs text-zinc-500">{item.founder_name}</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-500 font-mono font-bold">
                <Flame className="w-4 h-4 fill-current" />
                {item.burn_count}
              </div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-tighter">Burns</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
