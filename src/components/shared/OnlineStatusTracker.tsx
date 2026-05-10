import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OnlineStatusTracker() {
  const [foundersOnline, setFoundersOnline] = useState(Math.floor(Math.random() * 50) + 120);
  const [investorsOnline, setInvestorsOnline] = useState(Math.floor(Math.random() * 20) + 45);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFoundersOnline(prev => Math.max(100, prev + (Math.random() > 0.5 ? 1 : -1)));
      setInvestorsOnline(prev => Math.max(30, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 w-full">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full group relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between hover:border-orange-500/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
            <div className="absolute inset-0 bg-orange-500/20 blur-sm animate-pulse rounded-full"></div>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Network Pulse</span>
            <span className="text-xs font-black text-white">{foundersOnline + investorsOnline} Active Now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900 z-20 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <div className="w-2 h-2 rounded-full bg-orange-500 border border-zinc-900 z-10"></div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-zinc-600 group-hover:text-zinc-400"
            >
               <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </motion.div>
        </div>

        {/* Hover Glow */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 pt-2 px-1">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between group/item hover:bg-zinc-800/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-orange-500/10 rounded-lg group-hover/item:scale-110 transition-transform">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">FOUNDERS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-white">{foundersOnline}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between group/item hover:bg-zinc-800/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover/item:scale-110 transition-transform">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">INTRESTORS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-white">{investorsOnline}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center">
              <p className="text-[8px] font-mono text-emerald-500/80 uppercase tracking-widest italic">Signal Strength: High // Mainnet Priority</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
