import React, { useState } from 'react';
import { LayoutGrid, PlayCircle, Briefcase, Shield } from 'lucide-react';
import { GlobalSearch } from '../shared/GlobalSearch';
import { ChatWidget } from '../shared/ChatWidget';
import { NotificationSystem } from '../shared/NotificationSystem';
import { ViewportDropdown } from '../shared/ViewportSimulator';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Tab {
  id: string;
  icon: React.ElementType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'pitches', icon: PlayCircle, label: 'Feed' },
  { id: 'dashboard', icon: LayoutGrid, label: 'Command' },
  { id: 'theses', icon: Briefcase, label: 'Intrestors' },
];

import { StarEffect } from '../shared/StarEffect';

export default function DashboardLayout({ children, leftPane, rightPane }: { children: React.ReactNode, leftPane: React.ReactNode, rightPane: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const isAdmin = user?.email === 'johnnyblueagency@gmail.com';

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-[#F5F5F0] font-sans overflow-hidden select-none relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=2048")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <StarEffect />
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter text-orange-500 drop-shadow-lg">PITCHTUBE</h1>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Mainnet Connected</span>
          </div>
        </div>
        <div className="flex-1 max-w-xl px-8 hidden xl:block">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-6">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-2 hover:bg-orange-500/20 transition-all group"
            >
              <Shield className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Nexus Admin</span>
            </Link>
          )}
          <div className="hidden md:block">
            <ViewportDropdown />
          </div>
          <div className="hidden md:block text-[10px] font-mono font-bold text-zinc-400">SESSION: 08:42:11</div>
          <NotificationSystem />
          <Link 
            to={`/profile/${user?.uid}`}
            className="flex items-center gap-3 bg-zinc-900/60 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md hover:bg-zinc-800 hover:border-orange-500/30 transition-all group"
          >
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-[10px] font-black uppercase text-white group-hover:scale-110 transition-transform">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : '??')}
            </div>
            <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-orange-500 transition-colors uppercase">{user?.displayName || 'Authorized User'}</span>
          </Link>
        </div>
      </header>

      {/* MAIN TRIPLE-PANE INTERFACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] overflow-hidden relative">
        {/* GRID OVERLAY */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] z-0"></div>

        {/* LEFT PANE: Founder Pitches */}
        <aside className={`
          ${activeTab === 'pitches' ? 'flex flex-col w-full' : 'hidden'} 
          lg:flex lg:flex-col lg:w-[300px] border-r border-white/10 bg-zinc-950/20 backdrop-blur-sm overflow-y-auto no-scrollbar z-10
        `}>
          <div className="sticky top-0 z-20 p-4 bg-zinc-950/60 backdrop-blur-xl border-b border-white/10 flex justify-between items-center">
            <span className="text-[11px] font-mono text-orange-500 uppercase font-black tracking-[0.2em]">FOUNDER FEED</span>
            <span className="text-[10px] font-bold text-zinc-400">LIVE_04</span>
          </div>
          {leftPane}
        </aside>

        {/* CENTER PANE: Core Dashboard */}
        <main className={`
          ${activeTab === 'dashboard' ? 'flex flex-col w-full' : 'hidden'} 
          lg:flex lg:flex-col lg:flex-1 overflow-y-auto bg-transparent custom-scrollbar relative z-10
        `}>
          <nav className="sticky top-0 z-20 bg-zinc-950/40 backdrop-blur-xl p-4 border-b border-white/10 flex justify-between items-center">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Session Analytics // Series A
            </h1>
            <div className="lg:hidden xl:hidden block">
              <GlobalSearch />
            </div>
          </nav>
          <div className="p-8 pb-32 lg:pb-8 flex-1">
            {children}
          </div>
        </main>

        {/* RIGHT PANE: Investor Theses */}
        <aside className={`
          ${activeTab === 'theses' ? 'flex flex-col w-full' : 'hidden'} 
          lg:flex lg:flex-col lg:w-[300px] border-l border-white/10 bg-zinc-950/20 backdrop-blur-sm overflow-y-auto no-scrollbar z-10
        `}>
          <div className="sticky top-0 z-20 p-4 bg-zinc-950/60 backdrop-blur-xl border-b border-white/10 flex justify-between items-center">
            <span className="text-[11px] font-mono text-blue-400 uppercase font-black tracking-[0.2em]">REVERSE PITCHES</span>
            <span className="text-[10px] font-bold text-zinc-400">INTRESTOR_SYNC</span>
          </div>
          {rightPane}
        </aside>
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="h-8 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="text-[9px] font-mono font-bold text-zinc-500">VER_0.4.2_STABLE</div>
          <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">ENCRYPTION: AES-256-GCM</div>
        </div>
        <div className="text-[9px] font-mono font-bold text-orange-500 tracking-widest hidden sm:block">
           SYSTEMS_NOMINAL // HEAT_INDEX_98.2
        </div>
      </footer>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-around px-6 z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-zinc-500'
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Floating Chat Widgets */}
      <ChatWidget 
        type="founder" 
        label="Chat with Founder" 
        side="left" 
      />
      <ChatWidget 
        type="investor" 
        label="Chat with Destiny Changer" 
        side="right" 
      />
    </div>
  );
}
