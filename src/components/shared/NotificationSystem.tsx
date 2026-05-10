import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Zap, User, Briefcase, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  type: 'pitch' | 'intrestor' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
}

export function NotificationSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Simulate incoming notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const chance = Math.random();
      if (chance > 0.8) {
        const newNotif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          type: Math.random() > 0.5 ? 'pitch' : 'intrestor',
          title: Math.random() > 0.5 ? 'New Signal Received' : 'Network Update',
          message: Math.random() > 0.5 ? 'A founder you follow just updated their deck.' : 'A new investor joined your sector.',
          timestamp: new Date(),
          isRead: false,
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 10));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500 transition-all group"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-lg shadow-orange-500/20"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase italic tracking-widest text-white">Inbox // Signal</h4>
                <div className="flex gap-2">
                  <button onClick={markAllRead} className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase">Read All</button>
                  <span className="text-zinc-800">|</span>
                  <button onClick={clearAll} className="text-[9px] font-mono text-zinc-500 hover:text-red-500 uppercase">Clear</button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <motion.div 
                      key={n.id}
                      initial={{ background: n.isRead ? 'transparent' : 'rgba(249, 115, 22, 0.05)' }}
                      className={`relative p-4 group hover:bg-zinc-800/50 transition-all border-b border-zinc-800/50 last:border-0 ${!n.isRead ? 'border-l-2 border-l-orange-500' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          n.type === 'pitch' ? 'bg-orange-500/10 text-orange-500' : 
                          n.type === 'intrestor' ? 'bg-blue-500/10 text-blue-500' : 
                          'bg-zinc-700 text-white'
                        }`}>
                          {n.type === 'pitch' ? <User className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-0.5">
                            {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h5 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">{n.title}</h5>
                          <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{n.message}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center text-center px-6">
                    <Zap className="w-8 h-8 text-zinc-800 mb-2" />
                    <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-tight">No active signals in your sector.</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-zinc-950/50 border-t border-zinc-800">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
                >
                  Close Access
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
