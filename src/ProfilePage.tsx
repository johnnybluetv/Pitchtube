import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Video, 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  Upload, 
  Linkedin, 
  Twitter, 
  Github, 
  Globe, 
  ChevronLeft,
  Plus,
  MoreVertical,
  Share2,
  Calendar,
  Settings,
  Bell,
  Check,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { useAuth } from './context/AuthContext';
import { PitchCard } from './components/feed/PitchCard';
import { IntrestorCard } from './components/intrestor/IntrestorCard';
import { UploadModal } from './components/profile/UploadModal';
import { ProfileEditModal } from './components/profile/ProfileEditModal';
import { ViewportDropdown } from './components/shared/ViewportSimulator';

type TabType = 'videos' | 'documents' | 'posts' | 'images' | 'transactions' | 'settings';

interface FundingRound {
  round: string;
  amount: string;
  date: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'reward';
  amount: number;
  status: 'completed' | 'pending';
  date: string;
}

interface ProfileData {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'founder' | 'investor';
  bio?: string;
  headline?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  website_url?: string;
  cover_url?: string;
  fundingHistory?: FundingRound[];
  transactionHistory?: Transaction[];
  notificationSettings?: {
    emailNewPitches?: boolean;
    emailInvestments?: boolean;
    emailTransactions?: boolean;
  };
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadType, setUploadType] = useState<TabType | 'need' | 'thesis'>('posts');
  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as ProfileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId || !activeTab) return;

    let colName = '';
    let filterField = 'userId';
    
    switch (activeTab) {
      case 'videos': 
        colName = profile?.role === 'investor' ? 'intrestors' : 'pitches';
        filterField = profile?.role === 'investor' ? 'id' : 'founderId'; // For investors, their id is the doc id in intrestors
        break;
      case 'documents': colName = 'documents'; break;
      case 'posts': colName = 'posts'; break;
      case 'images': colName = 'images'; break;
    }

    if (!colName) return;

    const q = query(
      collection(db, colName),
      where(filterField, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContent(items);
    }, (err) => {
      console.error(`Error fetching ${activeTab}:`, err);
      // Fallback or empty state
      setContent([]);
    });

    return () => unsubscribe();
  }, [userId, activeTab, profile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: 'videos', icon: Video, label: 'Videos' },
    { id: 'documents', icon: FileText, label: 'Docs' },
    { id: 'posts', icon: MessageSquare, label: 'Posts' },
    { id: 'images', icon: ImageIcon, label: 'Images' },
    { id: 'transactions', icon: Calendar, label: 'History' },
    ...(isOwnProfile ? [{ id: 'settings', icon: Settings, label: 'Settings' }] : [])
  ] as { id: TabType; icon: any; label: string }[];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden no-scrollbar">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 px-6 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="font-black italic text-xl tracking-tighter text-orange-500">PITCHTUBE</span>
        </div>
        <div className="flex items-center gap-4">
          <ViewportDropdown />
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Profile Header (LinkedIn Style) */}
      <div className="relative pt-16">
        {/* Cover Image */}
        <div className="h-48 md:h-64 lg:h-80 w-full overflow-hidden relative">
          <img 
            src={profile?.cover_url || "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=2000"} 
            className="w-full h-full object-cover grayscale opacity-50 transition-opacity hover:opacity-70 duration-700" 
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        {/* Profile Info Container */}
        <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-zinc-900 border-4 border-[#050505] overflow-hidden shadow-2xl group cursor-pointer">
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                  alt={profile?.displayName}
                />
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#050505] animate-pulse shadow-lg shadow-emerald-500/20" />
            </div>

            {/* Basic Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic translate-y-1">
                  {profile?.displayName}
                </h2>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                    profile?.role === 'founder' 
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    {profile?.role}
                  </span>
                  {isOwnProfile && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/50 bg-white/5 uppercase tracking-widest">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <p className="text-lg md:text-xl text-zinc-400 font-medium tracking-tight mb-4 max-w-2xl">
                {profile?.headline || `Revolutionizing ${profile?.role === 'founder' ? 'industries' : 'investments'} through PitchTube.`}
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-3">
                  <a href={profile?.linkedin_url || "#"} className="p-2 bg-white/5 hover:bg-[#0077b5]/20 hover:text-[#0077b5] rounded-xl border border-white/10 transition-all">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href={profile?.twitter_url || "#"} className="p-2 bg-white/5 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] rounded-xl border border-white/10 transition-all">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href={profile?.github_url || "#"} className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-xl border border-white/10 transition-all">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={profile?.website_url || "#"} className="p-2 bg-white/5 hover:bg-orange-500/20 hover:text-orange-500 rounded-xl border border-white/10 transition-all">
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
                <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  Joined May 2024
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {isOwnProfile ? (
                 <>
                  {profile?.role === 'investor' && (
                    <button 
                      onClick={() => { setUploadType('thesis'); setIsUploadOpen(true); }}
                      className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
                    >
                      Upload Thesis
                    </button>
                  )}
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="flex-1 md:flex-none px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 md:flex-none px-8 py-3 bg-orange-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95">
                    Connect
                  </button>
                  <button className="flex-1 md:flex-none px-8 py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all active:scale-95">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-12 max-w-3xl">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-4">About the {profile?.role}</h3>
            <p className="text-zinc-300 leading-relaxed text-lg">
              {profile?.bio || `This ${profile?.role} hasn't shared their story yet. Stay tuned for updates on their journey.`}
            </p>
          </div>

          {/* Tabs Section (The "TikTok" Part) */}
          <div className="sticky top-16 z-30 bg-[#050505] border-b border-white/5 mb-8">
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 pb-4 transition-all whitespace-nowrap relative ${
                    activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-white/70'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : ''}`} />
                  <span className="font-black uppercase text-xs tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="pb-32">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                {activeTab} Feed — {content.length} Items
              </h4>
              <AnimatePresence>
                {isOwnProfile && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => { setUploadType(activeTab); setIsUploadOpen(true); }}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
                  >
                    <Plus className="w-4 h-4 text-orange-500" />
                    <span className="font-black uppercase text-[10px] tracking-widest">Add {activeTab.slice(0, -1)}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeTab === 'settings' ? (
                    <div className="max-w-2xl space-y-8">
                       <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                                <Bell className="w-6 h-6 text-orange-500" />
                             </div>
                             <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Notification Protocol</h3>
                                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Manage your neural uplink alerts</p>
                             </div>
                          </div>

                          <div className="space-y-6">
                             {[
                               { id: 'emailNewPitches', label: 'New Pitch Alerts', description: 'Get notified when founders upload new signal to the network.' },
                               { id: 'emailInvestments', label: 'Investment Interest', description: 'Instant alerts when big capital requests a connection.' },
                               { id: 'emailTransactions', label: 'Ledger Updates', description: 'Notifications for successful neural credit transactions.' }
                             ].map((pref) => {
                               const isEnabled = profile?.notificationSettings?.[pref.id as keyof typeof profile.notificationSettings] !== false;
                               return (
                                 <div key={pref.id} className="flex items-center justify-between group">
                                   <div className="flex flex-col">
                                      <span className="text-white font-bold text-sm mb-1">{pref.label}</span>
                                      <span className="text-zinc-500 text-[10px] pr-8">{pref.description}</span>
                                   </div>
                                   <button 
                                      onClick={async () => {
                                        const nextValue = !isEnabled;
                                        setProfile(prev => prev ? {
                                          ...prev,
                                          notificationSettings: {
                                            ...(prev.notificationSettings || {}),
                                            [pref.id]: nextValue
                                          }
                                        } : null);
                                        
                                        if (userId) {
                                          await updateDoc(doc(db, 'users', userId), {
                                            [`notificationSettings.${pref.id}`]: nextValue
                                          });
                                        }
                                      }}
                                      className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${
                                        isEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                                      }`}
                                   >
                                      <motion.div 
                                        animate={{ x: isEnabled ? 24 : 0 }}
                                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                                      >
                                         {isEnabled && <Check className="w-3 h-3 text-orange-500" />}
                                      </motion.div>
                                   </button>
                                 </div>
                               );
                             })}
                          </div>
                       </div>

                       <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                          <h3 className="text-sm font-black uppercase tracking-widest mb-4">Neural Profile Security</h3>
                          <button 
                            onClick={() => alert('Authentication factor management is restricted to biometric verification on the local node.')}
                            className="w-full py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                          >
                            Manage Master Credentials
                          </button>
                       </div>
                    </div>
                  ) : activeTab === 'transactions' ? (
                    <div className="max-w-4xl space-y-8">
                      {/* Transaction History Section */}
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8">Neural Ledger Traffic</h3>
                        <div className="space-y-4">
                          {(profile?.transactionHistory || [
                            { id: 'tx_1', type: 'investment', amount: 250000, status: 'completed', date: '2024-03-15' },
                            { id: 'tx_2', type: 'reward', amount: 500, status: 'completed', date: '2024-03-10' },
                            { id: 'tx_3', type: 'deposit', amount: 1000, status: 'completed', date: '2024-03-05' }
                          ]).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-orange-500/30 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                                  tx.type === 'investment' ? 'bg-emerald-500/10 text-emerald-500' : 
                                  tx.type === 'reward' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {tx.type.substring(0, 3)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white uppercase tracking-tight">{tx.type}</p>
                                  <p className="text-[10px] font-mono text-zinc-600">ID: {tx.id.toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-12">
                                <div className="text-center hidden md:block">
                                  <p className="text-[10px] font-mono text-zinc-600 uppercase">Timestamp</p>
                                  <p className="text-xs font-bold text-zinc-400">{tx.date}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black italic text-white">${tx.amount.toLocaleString()}</p>
                                  <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">{tx.status}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'videos' ? (
                    <div className="space-y-12">
                      {profile?.role === 'founder' && (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 mb-12">
                          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Briefcase className="w-6 h-6 text-orange-500" />
                            Funding Trajectory
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(profile?.fundingHistory || [
                              { round: 'Seed Round', amount: '$1.2M', date: 'Jan 2024' },
                              { round: 'Pre-Seed', amount: '$250K', date: 'June 2023' }
                            ]).map((round: any, i: number) => (
                              <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-orange-500/30 transition-all">
                                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">{round.date}</p>
                                <h4 className="text-lg font-black text-white italic mb-2 tracking-tight uppercase">{round.round}</h4>
                                <p className="text-2xl font-black text-orange-500 italic leading-none">{round.amount}</p>
                              </div>
                            ))}
                            <div 
                              onClick={() => setIsEditOpen(true)}
                              className="p-6 bg-orange-500/10 border border-dashed border-orange-500/20 rounded-2xl flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-orange-500/20 transition-all"
                            >
                               <Plus className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Log New Round</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-12">
                        {content.length > 0 ? (
                          content.map((item) => (
                            <ContentItem key={item.id} type={activeTab} data={item} role={profile?.role} />
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-24 text-zinc-600 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl w-full">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                              <Video className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-mono uppercase text-[10px] tracking-widest mb-1">Status Code: EMPTY</p>
                            <p className="font-medium text-sm">No video signals discovered in this sector yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : content.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {content.map((item) => (
                        <ContentItem key={item.id} type={activeTab} data={item} role={profile?.role} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-600 bg-white/[0.02] border border-dashed border-white/5 rounded-3xl">
                      <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                        {(() => {
                          const TabIcon = tabs.find(t => t.id === activeTab)?.icon || Video;
                          return <TabIcon className="w-8 h-8 opacity-20" />;
                        })()}
                      </div>
                      <p className="font-mono uppercase text-[10px] tracking-widest mb-1">Status Code: EMPTY</p>
                      <p className="font-medium text-sm">No {activeTab} discovered in this sector yet.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        type={uploadType as any}
        userId={userId || ''}
        userRole={profile?.role}
      />

      <ProfileEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profile={profile}
        onUpdate={(updated) => setProfile(updated)}
      />
    </div>
  );
}

const ContentItem: React.FC<{ type: TabType; data: any; role?: string }> = ({ type, data, role }) => {
  if (type === 'videos') {
    if (role === 'investor') {
      return <IntrestorCard intrestor={data} />;
    }
    return <PitchCard pitch={data} />;
  }

  if (type === 'posts') {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-all group">
        <p className="text-zinc-100 text-lg leading-relaxed mb-6">
          {data.content}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            {new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}
          </span>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Share2 className="w-4 h-4 text-zinc-500" /></button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-zinc-500" /></button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'documents') {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all group flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-8">
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
            <FileText className="w-8 h-8 text-blue-500 group-hover:text-white transition-all" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded border border-white/5 text-zinc-500">
            {data.fileType?.toUpperCase() || 'DOCUMENT'}
          </span>
        </div>
        <div>
          <h5 className="text-white font-bold text-lg mb-2 truncate group-hover:text-blue-400 transition-colors">{data.name}</h5>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              {new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}
            </span>
            <a 
              href={data.fileURL} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              View Document
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'images') {
    return (
      <div className="group relative aspect-square overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 transition-all">
        <img 
          src={data.imageURL} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
          alt={data.caption}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
          <p className="text-white text-sm font-medium mb-3">{data.caption}</p>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/50 uppercase">
              {new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}
            </span>
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all">
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
