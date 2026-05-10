import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Eye, Bookmark, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardAnalyticsProps {
  type: 'investor' | 'founder';
  userId: string;
}

export function DashboardAnalytics({ type, userId }: DashboardAnalyticsProps) {
  const [stats, setStats] = useState({
    viewed: 0,
    saved: 0,
    engagementRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // We track interactions in a collection 'user_interactions'
    // { userId: string, itemId: string, type: 'view' | 'save', itemType: 'pitch' | 'intrestor' }
    
    const interactionsRef = collection(db, 'user_interactions');
    const viewedQuery = query(
      interactionsRef, 
      where('userId', '==', userId), 
      where('type', '==', 'view'),
      where('itemType', '==', type === 'investor' ? 'intrestor' : 'pitch')
    );

    const savedQuery = query(
      interactionsRef, 
      where('userId', '==', userId), 
      where('type', '==', 'save'),
      where('itemType', '==', type === 'investor' ? 'intrestor' : 'pitch')
    );

    const unsubscribeViewed = onSnapshot(viewedQuery, (snapshot) => {
      const viewedCount = snapshot.size;
      setStats(prev => ({ 
        ...prev, 
        viewed: viewedCount,
        engagementRate: viewedCount > 0 ? Math.round((prev.saved / viewedCount) * 100) : 0
      }));
    });

    const unsubscribeSaved = onSnapshot(savedQuery, (snapshot) => {
      const savedCount = snapshot.size;
      setStats(prev => ({ 
        ...prev, 
        saved: savedCount,
        engagementRate: stats.viewed > 0 ? Math.round((savedCount / stats.viewed) * 100) : 0
      }));
    });

    setLoading(false);

    return () => {
      unsubscribeViewed();
      unsubscribeSaved();
    };
  }, [userId, type]);

  const chartData = [
    { name: 'Viewed', value: stats.viewed, color: type === 'investor' ? '#3b82f6' : '#f97316' },
    { name: 'Saved', value: stats.saved, color: '#10b981' }
  ];

  if (loading) return (
    <div className="h-48 flex items-center justify-center bg-zinc-900/20 rounded-2xl border border-zinc-800 animate-pulse">
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Synchronizing Analytics...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden relative group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <BarChart3 className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">
              {type === 'investor' ? 'Investor' : 'Founder'} Analytics
            </h3>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">Live Data Stream // Performance Metrics</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Realtime Sync</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Stats Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-xl border ${type === 'investor' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    <Eye className={`w-4 h-4 ${type === 'investor' ? 'text-blue-500' : 'text-orange-500'}`} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{type === 'investor' ? 'Intrestors' : 'Pitches'} Viewed</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-tighter tabular-nums">{stats.viewed}</div>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                    <Bookmark className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{type === 'investor' ? 'Intrestors' : 'Pitches'} Saved</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-tighter tabular-nums">{stats.saved}</div>
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
               <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Engagement Conversion</p>
                    <div className="text-2xl font-black font-mono text-zinc-200">{stats.engagementRate}%</div>
                  </div>
                  <div className="bg-zinc-800 px-3 py-1 rounded-lg">
                     <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
               </div>
               <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 transition-all duration-1000" style={{ width: `${stats.engagementRate}%` }} />
            </div>
          </div>

          {/* Chart Component */}
          <div className="h-64 bg-zinc-950/40 border border-zinc-800 p-6 rounded-3xl relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="absolute -bottom-1 -right-1 p-4">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                 <TrendingUp className="w-6 h-6 text-zinc-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
