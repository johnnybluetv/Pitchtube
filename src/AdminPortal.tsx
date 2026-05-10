import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Shield, Trash2, Users, Video, Briefcase, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pitches' | 'investors' | 'users'>('pitches');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Protect the route
  const isAdmin = user?.email === 'johnnyblueagency@gmail.com';
  
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const collectionName = activeTab === 'pitches' ? 'pitches' : activeTab === 'investors' ? 'intrestors' : 'users';
    
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${activeTab}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This action is irreversible.')) return;
    
    try {
      const collectionName = activeTab === 'pitches' ? 'pitches' : activeTab === 'investors' ? 'intrestors' : 'users';
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Check permissions.');
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = (item.company_name || item.founder_name || item.investor_name || item.displayName || item.email || '').toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/20">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Nexus Control Center</h1>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em]">Administrator Privileges: ACTIVE // Verified: {user?.email}</p>
          </div>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          {[
            { id: 'pitches', icon: Video, label: 'Pitches' },
            { id: 'investors', icon: Briefcase, label: 'Investors' },
            { id: 'users', icon: Users, label: 'Users' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-zinc-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text"
          placeholder={`Search across ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono focus:outline-none focus:border-orange-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-40 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Querying Neural Networks...</span>
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-900/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                {activeTab === 'users' ? (
                   <img src={item.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.id}`} alt="" className="w-12 h-12 rounded-full border border-white/10" />
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    {activeTab === 'pitches' ? <Video className="w-5 h-5 text-zinc-400" /> : <Briefcase className="w-5 h-5 text-zinc-400" />}
                  </div>
                )}
                
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-lg leading-none mb-1">
                    {activeTab === 'pitches' ? item.company_name : activeTab === 'investors' ? item.investor_name : item.displayName || 'Unnamed User'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <span>ID: {item.id.substring(0, 8)}...</span>
                    {activeTab !== 'users' && <span>Founder: {item.founder_name || item.investor_name}</span>}
                    {item.email && <span>{item.email}</span>}
                    {item.role && <span className="text-orange-500 font-black">Role: {item.role}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 flex items-center justify-center text-zinc-700 group-hover:text-zinc-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-40 flex flex-col items-center text-center px-6">
            <AlertTriangle className="w-12 h-12 text-zinc-800 mb-4" />
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-2">Null Data Stream</h3>
            <p className="text-zinc-600 text-[10px] font-mono leading-tight max-w-[240px]">
              No entries found matching your clearance level or search criteria in the {activeTab} sector.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
