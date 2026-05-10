import React, { useState } from 'react';
import { StatsGrid } from './components/analytics/StatsGrid';
import { DashboardAnalytics } from './components/analytics/DashboardAnalytics';
import { PitchScorecard } from './components/analytics/PitchScorecard';
import { DealFlowFeed } from './components/analytics/DealFlowFeed';
import { TrendingLeaderboard } from './components/analytics/TrendingLeaderboard';
import { UploadModal } from './components/profile/UploadModal';
import { OnlineStatusTracker } from './components/shared/OnlineStatusTracker';
import { Upload, MessageSquare, Image as ImageIcon, FileText, Headphones } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';
import { WithdrawalPanel } from './components/wallet/WithdrawalPanel';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function DashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'videos' | 'posts' | 'images' | 'documents' | 'audio'>('videos');
  const { user, profile } = useAuth();
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  // Fetch recent uploads across types (simplified for demo by checking posts)
  React.useEffect(() => {
    if (!user?.uid) return;

    // In a real multi-type feed we'd use multiple queries or a unified index
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentUploads(snapshot.docs.map(d => ({ id: d.id, ...d.data(), type: 'post' })));
      setLoadingMedia(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Section */}
      <header className="mb-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl font-black tracking-tighter mb-2 italic">FOUNDER COMMAND</h2>
          <p className="text-zinc-400 text-sm font-medium">
            Managing pitch performance for{' '}
            <span className="text-white underline decoration-orange-500 decoration-2 underline-offset-4">
              {profile?.companyName || profile?.displayName || user?.displayName || 'Your Startup'}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-center lg:items-end w-full lg:w-auto gap-4">
          <div className="flex gap-2 w-full lg:w-auto">
            <button 
              onClick={() => { setUploadType('videos'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-orange-600 hover:bg-orange-500 rounded-2xl text-white transition-all shadow-lg shadow-orange-950/20 group flex flex-col items-center gap-1"
              title="Pitch Video"
            >
              <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest">Pitch</span>
            </button>
            <button 
              onClick={() => { setUploadType('posts'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Text Update"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
            </button>
            <button 
              onClick={() => { setUploadType('images'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Media Gallery"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Media</span>
            </button>
            <button 
              onClick={() => { setUploadType('audio'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Audio Pitch"
            >
              <Headphones className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Audio</span>
            </button>
            <button 
              onClick={() => { setUploadType('documents'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Documentation"
            >
              <FileText className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Docs</span>
            </button>
          </div>
          
          <div className="w-full lg:w-auto min-w-[200px]">
            <OnlineStatusTracker />
          </div>
        </div>
      </header>
      
      <div className="mb-8">
        <DashboardAnalytics type="founder" userId={user?.uid || ''} />
      </div>

      <StatsGrid />
      
      <div className="mb-12">
        <WithdrawalPanel />
      </div>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Activity Hub // Signal Distribution</h3>
              <Link 
                to={`/profile/${user?.uid}`}
                className="text-[10px] font-bold text-orange-500 hover:underline flex items-center gap-1"
              >
                View Full Profile
              </Link>
           </div>
           
           <div className="space-y-4">
              {loadingMedia ? (
                <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : recentUploads.length > 0 ? (
                recentUploads.map(post => (
                  <div key={post.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-orange-500/30 transition-all">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs line-clamp-2 mb-2 font-medium leading-relaxed group-hover:text-orange-500 transition-colors">{post.content}</p>
                        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Transmission Logged: {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 border border-dashed border-white/5 rounded-2xl text-center">
                   <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest">No Recent Signals Detected</p>
                </div>
              )}
           </div>
        </section>

        <TrendingLeaderboard />
        <PitchScorecard />
        <DealFlowFeed />
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        type={uploadType}
        userId={user?.uid || ''}
        userRole="founder"
      />
    </div>
  );
}
