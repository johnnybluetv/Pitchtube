import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Wallet, ArrowRight, User as UserIcon, Camera, Layout, Target, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { useAuth } from './context/AuthContext';

type OnboardingStep = 'role' | 'profile' | 'briefing' | 'complete';

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('role');
  const [role, setRole] = useState<'founder' | 'investor' | null>(null);
  const [profileData, setProfileData] = useState({
    displayName: auth.currentUser?.displayName || '',
    headline: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleComplete = async () => {
    if (!role || !auth.currentUser) return;
    setLoading(true);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...profileData,
        role,
        onboarded: true
      });
      // Force a slight delay to ensure firestore propagates
      setTimeout(() => navigate(role === 'investor' ? '/investor' : '/'), 1500);
    } catch (err) {
      console.error("Onboarding failed:", err);
      // Fallback for demo if firestore fails
      setTimeout(() => navigate(role === 'investor' ? '/investor' : '/'), 1000);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'role', label: 'Ecosystem Identity' },
    { id: 'profile', label: 'Neural Profile' },
    { id: 'briefing', label: 'Briefing' },
  ];

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-white scanlines overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      {/* Step Progress */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  step === s.id ? 'bg-orange-500 scale-150 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 
                  steps.findIndex(x => x.id === step) > i ? 'bg-zinc-500' : 'bg-zinc-800'
                }`} 
              />
              <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${step === s.id ? 'opacity-100' : 'opacity-30'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-12 h-[1px] bg-zinc-800 -translate-y-3" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'role' && (
          <motion.div 
            key="role"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="max-w-md w-full text-center z-10"
          >
            <h1 className="text-5xl font-black italic tracking-tighter mb-4 text-orange-500">PITCHTUBE</h1>
            <p className="text-zinc-400 mb-12 uppercase tracking-[0.3em] text-[10px] font-mono">Select your ecosystem role</p>

            <div className="grid grid-cols-1 gap-4 mb-8 text-left">
              <button 
                onClick={() => setRole('founder')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 group relative overflow-hidden backdrop-blur-sm ${
                  role === 'founder' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
                }`}
              >
                <div className={`p-4 rounded-2xl transition-colors ${role === 'founder' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                  <Rocket className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">I am a Founder</h3>
                  <p className="text-sm text-zinc-500 leading-tight">I want to pitch my startup and raise capital.</p>
                </div>
              </button>

              <button 
                onClick={() => setRole('investor')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 group relative overflow-hidden backdrop-blur-sm ${
                  role === 'investor' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
                }`}
              >
                <div className={`p-4 rounded-2xl transition-colors ${role === 'investor' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">I am an Investor</h3>
                  <p className="text-sm text-zinc-500 leading-tight">I want to find deal flow and manage portfolio.</p>
                </div>
              </button>
            </div>

            <button
              disabled={!role}
              onClick={() => setStep('profile')}
              className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 group"
            >
              CONTINUE PROTOCOL
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="max-w-md w-full z-10"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black italic tracking-tight uppercase text-white mb-2 leading-none">Neural Identity</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Constructing Global Avatar</p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center">
                    {auth.currentUser?.photoURL ? (
                      <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-zinc-700" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-2 bg-orange-500 rounded-xl shadow-lg ring-4 ring-black">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-bold"
                    placeholder="Full Identification"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Identity Headline</label>
                  <input
                    type="text"
                    value={profileData.headline}
                    onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-bold"
                    placeholder={role === 'founder' ? "CEO @ Stealth Startup" : "Angel Investor @ Global Ventures"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Brief Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all text-sm font-bold resize-none h-24"
                    placeholder="Tell your story in 140 characters..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('role')}
                className="p-5 border border-white/5 rounded-2xl hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-500" />
              </button>
              <button
                disabled={!profileData.displayName}
                onClick={() => setStep('briefing')}
                className="flex-1 py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              >
                SYNC DATA
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'briefing' && (
          <motion.div 
            key="briefing"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="max-w-2xl w-full z-10"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2 leading-none">Operational Intel</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Protocol Briefing Completed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-xl group hover:border-orange-500/30 transition-all">
                <div className="p-4 bg-orange-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-orange-500" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-2 italic">Neural Feed</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tighter">
                  Real-time high-fidelity video pitches with immersive deck viewing.
                </p>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-xl group hover:border-blue-500/30 transition-all">
                <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-2 italic">Match Matrix</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tighter">
                  Strategic alignment algorithms matching founders with specific capital sources.
                </p>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-xl group hover:border-purple-500/30 transition-all">
                <div className="p-4 bg-purple-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-2 italic">Global Hub</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tighter">
                  Unified command center for portfolio tracking and fundraising ops.
                </p>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleComplete}
              className={`w-full py-6 font-black uppercase text-xs tracking-[0.3em] rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                loading ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  INITIALIZE SYSTEM
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
