import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Phone, 
  Github, 
  Chrome, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  Brain,
  Globe,
  Sparkles,
  Bot,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { useNavigate } from 'react-router-dom';
import { CharityEarthButton } from './components/CharityEarthButton';
import { BiometricModal } from './components/auth/BiometricModal';
import { ViewportDropdown } from './components/shared/ViewportSimulator';

import { triggerEffect } from './components/shared/StarEffect';

import { LivingGalaxy } from './components/shared/LivingGalaxy';
import { Volume2, VolumeX } from 'lucide-react';

type Provider = 'google' | 'facebook' | 'linkedin' | 'youtube' | 'github' | 'email' | 'phone' | 'ai';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Provider>('google');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Nature sounds
    const waves = new Audio('https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3');
    const birds = new Audio('https://assets.mixkit.co/active_storage/sfx/1109/1109-preview.mp3');
    const voices = new Audio('https://assets.mixkit.co/active_storage/sfx/1119/1119-preview.mp3');
    
    audioRefs.current = { waves, birds, voices };
    
    Object.values(audioRefs.current).forEach((audio: HTMLAudioElement) => {
      audio.loop = true;
      audio.volume = 0.2;
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio: HTMLAudioElement) => {
        audio.pause();
      });
    };
  }, []);

  useEffect(() => {
    if (isAudioEnabled) {
      Object.values(audioRefs.current).forEach((audio: HTMLAudioElement) => {
        audio.play().catch(e => console.log("Audio play blocked", e));
      });
    } else {
      Object.values(audioRefs.current).forEach((audio: HTMLAudioElement) => {
        audio.pause();
      });
    }
  }, [isAudioEnabled]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBiometricSuccess = () => {
    setIsBiometricOpen(false);
    // In a real app, this would verify a token. For demo, we navigate.
    navigate('/onboarding');
  };

  const handleProviderLogin = async (providerName: string) => {
    setIsLoading(true);
    try {
      let provider;
      switch (providerName) {
        case 'google':
        case 'youtube':
          provider = new GoogleAuthProvider();
          break;
        case 'facebook':
          provider = new FacebookAuthProvider();
          break;
        case 'linkedin':
          provider = new OAuthProvider('linkedin.com');
          break;
        case 'github':
          provider = new GithubAuthProvider();
          break;
        default:
          alert('This provider requires additional configuration in Firebase Console.');
          setIsLoading(false);
          return;
      }
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Trigger login visuals
      triggerEffect('shooting-star', 20);
      triggerEffect('falling-star', 15);

      // Notify server of login
      if (user.email) {
        try {
          await fetch('/api/notify-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.email, 
              displayName: user.displayName || 'User',
              provider: providerName
            })
          });
        } catch (e) {
          console.error("Login notification failed:", e);
        }
      }

      navigate('/onboarding');
    } catch (error) {
      console.error(error);
      alert('Authentication failed. Check your Firebase console settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const aiProviders = [
    { name: 'Gemini', icon: Sparkles, color: 'text-blue-400', desc: 'Google AI Identity' },
    { name: 'Claude', icon: Brain, color: 'text-orange-400', desc: 'Anthropic Neural Pass' },
    { name: 'Manus', icon: Cpu, color: 'text-emerald-400', desc: 'Autonomous Agent' },
    { name: 'Grok', icon: Zap, color: 'text-zinc-100', desc: 'X.AI Command' }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex items-center justify-center p-6 overflow-hidden relative">
      {/* Top Right: Credits */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
        <ViewportDropdown />
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
          Created by JOHNNYBLUE1 GROUP
        </p>
      </div>

      {/* Top Left: Connect Clock */}
      <div className="absolute top-8 left-8 z-20 flex flex-col items-start gap-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500 animate-pulse">
          INVESTOR? CONNECT YOUR TUBE TO THE SOURCE (FOUNDERS)
        </p>
        <div className="flex items-center gap-4 py-2 px-4 bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 group hover:border-orange-500/50 transition-all">
          <Clock className="w-5 h-5 text-white group-hover:text-orange-500 transition-colors" />
          <div className="font-mono text-xl font-black tracking-tighter text-white tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-400">
          Founder? TAKE A PITCH OF TIME TO CONNECT
        </p>
      </div>

      {/* Background Ambience & Living Galaxy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <LivingGalaxy />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full animate-[pulse_6s_infinite]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
      </div>

      {/* Audio Sync Controller */}
      <div className="absolute bottom-8 right-8 z-30">
        <button 
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={`group flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${
            isAudioEnabled 
            ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' 
            : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
          }`}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isAudioEnabled ? 'Audio Online' : 'Audio Sync'}
          </span>
          {isAudioEnabled && (
            <div className="flex gap-0.5 h-2 items-end">
              <div className="w-0.5 bg-orange-500 animate-[bounce_0.6s_infinite_0s]" />
              <div className="w-0.5 bg-orange-500 animate-[bounce_0.6s_infinite_0.2s]" />
              <div className="w-0.5 bg-orange-500 animate-[bounce_0.6s_infinite_0.4s]" />
            </div>
          )}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0.1, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10"
      >
        {/* Left Side: Brand & Visuals */}
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-full mb-6">
              <Zap className="w-3 h-3 text-orange-500 fill-current" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-200">Mainnet // Auth Node</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black italic tracking-tighter leading-none mb-6 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              PITCH<br /> 
              <span className="text-orange-500 border-b-4 border-orange-500/20">TUBE</span>
            </h1>
            <p className="text-zinc-200 text-lg max-w-sm font-bold drop-shadow-md">
              CONNECTING SOLUTIONS TO PROBLEMS A.K.A WHERE FOUNDERS AND INVESTORS CONNECT
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setIsBiometricOpen(true)}
              className="w-full flex items-center gap-4 group hover:bg-white/5 p-4 rounded-3xl transition-all border border-transparent hover:border-white/10"
            >
              <div className="w-12 h-12 bg-zinc-900/60 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-blue-500 transition-colors backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <h4 className="font-bold uppercase tracking-tight text-sm text-white">Biometric Sync</h4>
                <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase">Multi-Provider Encryption</p>
              </div>
            </button>
            <div className="flex items-center gap-4 group p-4">
              <div className="w-12 h-12 bg-zinc-900/60 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-orange-500 transition-colors backdrop-blur-md">
                <Globe className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight text-sm text-white">Global Handshake</h4>
                <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase">Real-time Credentialing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-8 lg:p-12 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative">
          <div className="flex gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
            {['google', 'facebook', 'linkedin', 'github', 'email', 'phone', 'ai'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as Provider)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  activeTab === t 
                  ? 'bg-white border-white text-black' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
             <AnimatePresence mode="wait">
                {activeTab === 'google' && (
                  <motion.div 
                    key="google"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <button 
                      onClick={() => handleProviderLogin('google')}
                      className="w-full flex items-center justify-between p-6 bg-white rounded-3xl hover:bg-zinc-200 transition-all text-black group"
                    >
                      <div className="flex items-center gap-4">
                        <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" className="w-6 h-6 object-contain" alt="Google" referrerPolicy="no-referrer" />
                        <span className="font-black uppercase italic tracking-tighter">Connect Google</span>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleProviderLogin('youtube')}
                      className="w-full flex items-center justify-between p-6 bg-red-600 rounded-3xl hover:bg-red-700 transition-all text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" className="w-10 h-6 object-contain" alt="YouTube" referrerPolicy="no-referrer" />
                        <span className="font-black uppercase italic tracking-tighter">Connect YouTube</span>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'facebook' && (
                  <motion.div 
                    key="facebook"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <button 
                      onClick={() => handleProviderLogin('facebook')}
                      className="w-full flex items-center justify-between p-6 bg-[#1877F2] rounded-3xl hover:bg-[#0C63D1] transition-all text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" className="w-6 h-6 object-contain" alt="Facebook" referrerPolicy="no-referrer" />
                        <span className="font-black uppercase italic tracking-tighter">Connect Facebook</span>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'linkedin' && (
                  <motion.div 
                    key="linkedin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <button 
                      onClick={() => handleProviderLogin('linkedin')}
                      className="w-full flex items-center justify-between p-6 bg-[#0077B5] rounded-3xl hover:bg-[#005E93] transition-all text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" className="w-6 h-6 object-contain" alt="LinkedIn" referrerPolicy="no-referrer" />
                        <span className="font-black uppercase italic tracking-tighter">Connect LinkedIn</span>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'github' && (
                  <motion.div 
                    key="github"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <button 
                      onClick={() => handleProviderLogin('github')}
                      className="w-full flex items-center justify-between p-6 bg-[#24292e] rounded-3xl hover:bg-[#1a1e22] transition-all text-white group"
                    >
                      <div className="flex items-center gap-4">
                        <Github className="w-6 h-6" />
                        <span className="font-black uppercase italic tracking-tighter">Connect GitHub</span>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'email' && (
                  <motion.div key="email" className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input 
                            type="email" 
                            placeholder="founder@sector.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                       </div>
                    </div>
                    <button className="w-full py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-zinc-200 transition-all active:scale-95">
                      Send Magic Link
                    </button>
                  </motion.div>
                )}

                {activeTab === 'phone' && (
                  <motion.div key="phone" className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Phone Number</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input 
                            type="tel" 
                            placeholder="+1 (555) 000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors"
                          />
                       </div>
                    </div>
                    <button className="w-full py-4 bg-orange-500 text-white font-black uppercase italic rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20">
                      Verify Identity
                    </button>
                  </motion.div>
                )}

                {activeTab === 'ai' && (
                  <motion.div key="ai" className="grid grid-cols-2 gap-4">
                     {aiProviders.map((ai) => (
                       <button
                         key={ai.name}
                         onClick={() => alert(`Connect through ${ai.name} agent proxy? This will use your AI identity.`)}
                         className="flex flex-col items-center gap-3 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl hover:border-blue-500/50 transition-all group"
                       >
                         <div className={`p-4 bg-zinc-900 rounded-2xl group-hover:scale-110 transition-transform ${ai.color}`}>
                           <ai.icon className="w-6 h-6" />
                         </div>
                         <div className="text-center">
                            <h4 className="font-black uppercase italic text-xs mb-0.5">{ai.name}</h4>
                            <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{ai.desc}</p>
                         </div>
                       </button>
                     ))}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center gap-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
             <div className="h-[1px] flex-1 bg-zinc-800" />
             <span>Secure Session Node</span>
             <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>
        </div>
      </motion.div>

      <CharityEarthButton />

      <BiometricModal 
        isOpen={isBiometricOpen} 
        onClose={() => setIsBiometricOpen(false)} 
        onSuccess={handleBiometricSuccess} 
      />

      {/* Footer Info */}
      <div className="absolute bottom-6 left-32 flex gap-6 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
         <span>Latency: 12ms</span>
         <span>Encryption: AES-256-GCM</span>
         <span>Status: Operational</span>
      </div>
    </div>
  );
}
