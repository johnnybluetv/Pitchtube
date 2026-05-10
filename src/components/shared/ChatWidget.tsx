import React, { useState } from 'react';
import { MessageSquare, X, Send, User, Briefcase, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWidgetProps {
  type: 'founder' | 'investor';
  label: string;
  side: 'left' | 'right';
}

export function ChatWidget({ type, label, side }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  // Mock Online Users
  const onlineUsers = [
    { id: '1', name: 'Alpha Founder', status: 'online', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
    { id: '2', name: 'Destiny Helper', status: 'online', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
    { id: '3', name: 'Secure Node', status: 'away', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
  ];

  const colorClass = type === 'founder' ? 'bg-orange-500' : 'bg-blue-600';
  const shadowClass = type === 'founder' ? 'shadow-orange-500/40' : 'shadow-blue-600/40';
  const borderClass = type === 'founder' ? 'border-orange-500/50' : 'border-blue-500/50';

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ x: side === 'left' ? 24 : -24, y: -24 }}
      className={`fixed bottom-24 lg:bottom-12 z-[100] ${side === 'left' ? 'left-6' : 'right-6'} cursor-move`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20, x: side === 'left' ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20, x: side === 'left' ? -20 : 20 }}
            className={`absolute bottom-24 ${side === 'left' ? 'left-0' : 'right-0'} w-80 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden cursor-default`}
          >
            {/* Online Pulse Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{label}</h4>
                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase">Ready_To_Sync</span>
                </div>
              </div>

              {/* Online Users Reveal */}
              <div className="flex -space-x-3 mb-2">
                {onlineUsers.map(user => (
                  <div key={user.id} className="relative group/user">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-950 overflow-hidden bg-zinc-900 transition-transform hover:-translate-y-1 cursor-help">
                      <img src={user.photo} className="w-full h-full object-cover" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${user.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  +12
                </div>
              </div>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Digital node: {onlineUsers.filter(u => u.status === 'online').length + 12} Agents Online</p>
            </div>

            {/* Chat Body */}
            <div className="h-64 p-6 flex flex-col justify-end gap-4 overflow-y-auto custom-scrollbar">
               <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-xl ${colorClass} flex items-center justify-center shrink-0 shadow-lg ${shadowClass}`}>
                     <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%] backdrop-blur-md">
                     <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                        Uplink secured. Synchronizing your request with our current available nodes.
                     </p>
                  </div>
               </div>
            </div>

            {/* Input Overlay */}
            <div className="p-4 bg-black/40 border-t border-white/5">
               <form 
                 onSubmit={(e) => { e.preventDefault(); setMessage(''); }}
                 className="flex gap-2"
               >
                  <input 
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="INITIATE COMMAND..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest"
                  />
                  <button className={`w-12 h-12 ${colorClass} text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl ${shadowClass}`}>
                    <Send className="w-5 h-5" />
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balloon Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:scale-110 active:scale-90 border-2 ${isOpen ? 'bg-zinc-900 border-white/20' : `${colorClass} ${borderClass} ${shadowClass}`} overflow-hidden`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="flex flex-col items-center justify-center h-full w-full p-2"
            >
              <span className="text-[7px] font-black text-white/90 uppercase tracking-tighter leading-none mb-1 text-center">
                {type === 'founder' ? 'Founder' : 'Destiny'}
              </span>
              <div className="w-4 h-[1px] bg-white/20 mb-1" />
              <span className="text-[6px] font-mono text-white/50 uppercase tracking-[0.2em]">
                {type === 'founder' ? 'Chat' : 'Helper'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balloon Reflection */}
        <div className="absolute top-1 left-3 w-4 h-2 bg-white/20 rounded-full blur-[1px] rotate-[-20deg]" />
      </button>

      {/* Online Count Indicator */}
      <div className="absolute -top-1 -right-1 flex flex-col items-end pointer-events-none">
        <div className="px-2 py-0.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20 border border-white/20">
          <span className="text-[8px] font-black text-black">ONLINE</span>
        </div>
      </div>
    </motion.div>
  );
}
