import React, { useState, useEffect, useMemo } from 'react';
import { StatsGrid } from './components/analytics/StatsGrid';
import { DashboardAnalytics } from './components/analytics/DashboardAnalytics';
import { DealFlowFeed } from './components/analytics/DealFlowFeed';
import { TrendingLeaderboard } from './components/analytics/TrendingLeaderboard';
import { UploadModal } from './components/profile/UploadModal';
import { OnlineStatusTracker } from './components/shared/OnlineStatusTracker';
import { Briefcase, Search, Filter, Video, RefreshCw, X, ChevronDown, MonitorPlay, Upload, MessageSquare, Image as ImageIcon, FileText, Headphones, Target, ArrowRight } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { WalletHeader } from './components/wallet/WalletHeader';
import { collection, query, where, onSnapshot, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Intrestor } from './components/intrestor/IntrestorCard';
import { PitchCard, Pitch } from './components/feed/PitchCard';

export default function InvestorDashboardPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'videos' | 'posts' | 'images' | 'documents' | 'need' | 'audio' | 'thesis'>('videos');
  const { user } = useAuth();
  const [savedIntrestors, setSavedIntrestors] = useState<Intrestor[]>([]);
  const [allIntrestors, setAllIntrestors] = useState<Intrestor[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [minMatchThreshold, setMinMatchThreshold] = useState(0);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  // Suggested Matches (top 3 by match score)
  const suggestedMatches = useMemo(() => {
    return pitches
      .map(p => ({
        ...p,
        matchScore: 85 + (parseInt(p.id.substring(0, 5)) || 10) % 15
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [pitches]);

  // Fetch recent uploads (posts)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentUploads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingMedia(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch Saved Intrestors
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'user_interactions'),
      where('userId', '==', user.uid),
      where('type', '==', 'save'),
      where('itemType', '==', 'intrestor')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const savedIds = snapshot.docs.map(d => d.data().itemId);
      const intrestorData: Intrestor[] = [];
      
      for (const id of savedIds) {
        try {
          const docRef = doc(db, 'intrestors', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            intrestorData.push({ id: docSnap.id, ...docSnap.data() } as Intrestor);
          }
        } catch (err) {
          console.error("Error fetching saved intrestor:", err);
        }
      }
      
      setSavedIntrestors(intrestorData);
      setLoadingSaved(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch All Investors for matching
  useEffect(() => {
    const q = query(collection(db, 'intrestors'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllIntrestors(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Intrestor)));
    });
    return () => unsubscribe();
  }, []);

  // Fetch Pitches and enrich with matching investor interest
  useEffect(() => {
    const q = query(collection(db, 'pitches'), orderBy('createdAt', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const pitchData = { id: doc.id, ...doc.data() } as Pitch;
        
        // Find a "relevant" investor who has shown interest (mock logic for demo)
        // In a real app, this would come from a real interaction collection
        if (allIntrestors.length > 0) {
          const relevant = allIntrestors.find(inv => 
            inv.focus_industries?.some(ind => ind.toLowerCase() === pitchData.category?.toLowerCase())
          ) || allIntrestors[Math.floor(Math.random() * allIntrestors.length)];

          if (relevant) {
            pitchData.interestedInvestor = {
              id: relevant.id,
              name: relevant.investor_name,
              firm: relevant.firm_name,
              avatar: relevant.thumbnail_url
            };
          }
        }

        return pitchData;
      });
      setPitches(fetched);
      setLoadingPitches(false);
    });

    return () => unsubscribe();
  }, [allIntrestors]); // Re-run enriching logic if allIntrestors changes

  const allIndustries = useMemo(() => {
    const industries = new Set<string>();
    savedIntrestors.forEach(i => (i.focus_industries || []).forEach(tag => industries.add(tag)));
    return ['all', ...Array.from(industries)];
  }, [savedIntrestors]);

  const filteredPitches = useMemo(() => {
    return pitches.filter(pitch => {
      const matchScore = 85 + (parseInt(pitch.id.substring(0, 5)) || 10) % 15;
      
      const matchesSearch = 
        pitch.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pitch.founder_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIndustry = industryFilter === 'all' || pitch.category === industryFilter;
      const matchesStage = stageFilter === 'all' || pitch.tier === stageFilter;
      const matchesThreshold = matchScore >= minMatchThreshold;
      
      return matchesSearch && matchesIndustry && matchesStage && matchesThreshold;
    });
  }, [pitches, searchQuery, industryFilter, stageFilter, minMatchThreshold]);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <header className="mb-10 flex flex-col lg:flex-row items-center justify-between gap-6 px-4">
        <div className="text-center lg:text-left flex-1">
          <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter italic">CAPITAL COMMAND</h2>
              <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest leading-none translate-y-0.5">Neural Hub // Active Session</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center lg:items-end w-full lg:w-auto gap-4">
          <div className="flex gap-2 w-full lg:w-auto">
            <button 
              onClick={() => { setUploadType('thesis'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-white text-black hover:bg-zinc-200 rounded-2xl transition-all shadow-xl group flex flex-col items-center gap-1 border border-white/10"
              title="Broadcast Thesis"
            >
              <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest">Broadcast Thesis</span>
            </button>
            <button 
              onClick={() => { setUploadType('posts'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Market Update"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
            </button>
            <button 
              onClick={() => { setUploadType('audio'); setIsUploadOpen(true); }}
              className="flex-1 lg:flex-none p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 flex flex-col items-center gap-1"
              title="Post Audio Intel"
            >
              <Headphones className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Audio</span>
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-4">
        {/* Left Column - Stats & Filters */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 px-2">Market Intelligence</h3>
             <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                   <p className="text-[8px] font-mono text-zinc-600 uppercase mb-1">Deal Velocity</p>
                   <p className="text-xl font-black text-white italic">+14.2% <span className="text-[10px] font-mono text-emerald-500 ml-2">▲</span></p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                   <p className="text-[8px] font-mono text-zinc-600 uppercase mb-1">Sector Heat</p>
                   <p className="text-xl font-black text-white italic">Generative AI</p>
                </div>
             </div>
          </div>

          {/* Sector Intensity Matrix */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 px-2">Sector Intensity</h3>
             <div className="grid grid-cols-2 gap-2">
                {['SAAS', 'AI', 'FINTECH', 'ENERGY', 'HEALTH', 'CRYPTO'].map((sector) => (
                  <div key={sector} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center gap-1 group hover:border-blue-500/50 transition-all cursor-crosshair">
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.random() * 80 + 20}%` }}
                        className="h-full bg-blue-500"
                        transition={{ duration: 2, ease: "easeOut" }}
                       />
                    </div>
                    <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-tighter">{sector}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 px-2">Thesis Deployment</h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="text"
                  placeholder="Query Node..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[7px] font-black uppercase tracking-widest text-zinc-600 pl-2">Segment Scope</label>
                <div className="relative group/filter">
                  <select 
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="w-full appearance-none bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white cursor-pointer hover:border-blue-500 transition-all focus:outline-none"
                  >
                    {allIndustries.map(ind => (
                      <option key={ind} value={ind}>{ind === 'all' ? 'Every Sector' : ind}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none group-hover/filter:text-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] font-black uppercase tracking-widest text-zinc-600 pl-2">Capital Stage</label>
                <div className="relative group/filter">
                  <select 
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full appearance-none bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white cursor-pointer hover:border-blue-500 transition-all focus:outline-none"
                  >
                    <option value="all">Any Stage</option>
                    <option value="30s">Pre-Seed (30s)</option>
                    <option value="1m">Seed (1m)</option>
                    <option value="3m">Series A (3m)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none group-hover/filter:text-blue-500" />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Neural Sync Threshold</span>
                    <span className="text-[10px] font-black text-blue-500 italic">{minMatchThreshold}%+</span>
                 </div>
                 <input 
                    type="range"
                    min="0"
                    max="95"
                    step="5"
                    value={minMatchThreshold}
                    onChange={(e) => setMinMatchThreshold(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                 />
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Feed */}
        <div className="lg:col-span-2 space-y-8">
           {/* Suggested Matches */}
           <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Neural Matches // High Precision</h3>
                <div className="p-1 bg-blue-500/10 rounded-lg">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {suggestedMatches.map((match, i) => (
                  <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-zinc-900/40 border border-white/5 rounded-[2rem] flex items-center justify-between hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                         <img src={match.thumbnail_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt="Thumb" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic text-white uppercase group-hover:text-blue-400 transition-colors">{match.company_name}</h4>
                        <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{match.category} // Raising {match.funding_goal?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xl font-black italic text-white leading-none">{match.matchScore}%</span>
                       <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Alignment</p>
                    </div>
                  </motion.div>
                ))}
              </div>
           </section>

           {/* Main Feed */}
           <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Stream // Real-time</h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                   <span className="text-[8px] font-mono text-zinc-500 uppercase">Live Feed</span>
                </div>
              </div>

              <div className="space-y-8">
                {loadingPitches ? (
                  <div className="py-20 flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-500 tracking-widest">ACCESSING DATAFRAME...</span>
                  </div>
                ) : filteredPitches.length > 0 ? (
                  filteredPitches.map(pitch => (
                    <div key={pitch.id} className="relative">
                      <PitchCard pitch={pitch} />
                    </div>
                  ))
                ) : (
                  <div className="py-20 border border-dashed border-zinc-800 rounded-[2.5rem] flex flex-col items-center text-center px-6 bg-zinc-900/20">
                    <X className="w-8 h-8 text-zinc-800 mb-4" />
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">No target matches in designated sectors</p>
                  </div>
                )}
              </div>
           </section>
        </div>

        {/* Right Column - Activity & Saved */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Portfolio Saved</h3>
                <Link to={`/profile/${user?.uid}`} className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
             </div>
             <div className="space-y-3">
                {loadingSaved ? (
                   <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 text-zinc-700 animate-spin" /></div>
                ) : savedIntrestors.length > 0 ? (
                  savedIntrestors.map(si => (
                    <div key={si.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group">
                       <p className="text-xs font-black text-white italic group-hover:text-blue-400 mb-1">{si.firm_name}</p>
                       <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Min {si.min_check}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 border border-dashed border-white/5 rounded-2xl text-center">
                    <p className="text-zinc-800 text-[8px] uppercase font-black tracking-widest">Vault Empty</p>
                  </div>
                )}
             </div>
           </div>

           <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 px-2">Global Broadcasts</h3>
              <div className="space-y-4">
                 {loadingMedia ? (
                   <div className="py-8 flex justify-center"><RefreshCw className="w-5 h-5 animate-spin text-zinc-700" /></div>
                 ) : recentUploads.length > 0 ? (
                   recentUploads.map(post => (
                     <div key={post.id} className="relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-blue-500">
                        <p className="text-[10px] text-zinc-400 leading-relaxed mb-1 line-clamp-2">{post.content}</p>
                        <span className="text-[7px] font-mono text-zinc-700 uppercase">{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                     </div>
                   ))
                 ) : (
                   <p className="text-[8px] font-mono text-zinc-700 uppercase px-2">No active transmissions</p>
                 )}
              </div>
           </div>

           {/* Institutional Alerts */}
           <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6 px-2">Institutional Alerts</h3>
              <div className="space-y-4">
                 {[
                   { msg: 'BlackRock Node active in Sector 7', time: '2m' },
                   { msg: 'Sequoia Signal detected in Fintech', time: '14m' },
                   { msg: 'A16Z broadcast: Crypto Thesis 2.0', time: '1h' }
                 ].map((alert, i) => (
                   <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                      <p className="text-[9px] font-bold text-white uppercase tracking-tight group-hover:text-orange-400 transition-colors">{alert.msg}</p>
                      <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">{alert.time} ago</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        type={uploadType}
        userId={user?.uid || ''}
        userRole="investor"
      />
    </div>
  );
}

