import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2, Download, Play, Pause, Volume2, VolumeX, Settings2, Globe, MessageSquare, MessageCircle, Bookmark, BarChart3, Activity, Zap, TrendingUp } from 'lucide-react';
import { LANGUAGES, MOCK_CAPTIONS } from '@/src/constants';
import { CommentSection } from './CommentSection';
import { trackInteraction } from '@/src/lib/analytics';
import { useAuth } from '@/src/context/AuthContext';
import { triggerEffect } from '../shared/StarEffect';

interface DeckViewerProps {
  deckUrl: string;
  videoSrc: string;
  onClose: () => void;
  founderName?: string;
  itemId?: string;
  category?: string;
  rating?: number;
  funding_goal?: number;
  thumbnailUrl?: string;
}

export function DeckViewer({ 
  deckUrl, 
  videoSrc, 
  onClose, 
  founderName = 'Founder', 
  itemId = 'mock-pitch-id',
  category = 'Technology',
  rating = 4.8,
  funding_goal,
  thumbnailUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
}: DeckViewerProps) {
  const [isPip, setIsPip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePanel, setActivePanel] = useState<'metrics' | 'boardroom' | 'none'>('none');
  const { user } = useAuth();

  // Calculate strategic match score based on pitch details and user profile
  const matchScore = useMemo(() => {
    // Determine base score
    let score = 82;
    
    // Add small random variations based on itemId
    const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    score += (hash % 15);
    
    return Math.min(score, 99);
  }, [itemId]);

  const metrics = useMemo(() => ({
    momentum: 74 + (matchScore % 20),
    burnVelocity: 82 - (matchScore % 15),
    engagement: 88 + (matchScore % 10)
  }), [matchScore]);

  const [simulatedMetrics, setSimulatedMetrics] = useState(metrics);

  useEffect(() => {
    setSimulatedMetrics(metrics);
  }, [metrics]);

  useEffect(() => {
    if (activePanel !== 'metrics') return;

    const interval = setInterval(() => {
      setSimulatedMetrics(prev => ({
        momentum: Math.min(100, Math.max(0, prev.momentum + (Math.random() - 0.5) * 4)),
        burnVelocity: Math.min(100, Math.max(0, prev.burnVelocity + (Math.random() - 0.5) * 2)),
        engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() - 0.5) * 3))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [activePanel]);

  const AnimatedNumber = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(value);
    
    useEffect(() => {
      const start = displayValue;
      const end = value;
      const duration = 1000;
      let startTimestamp: number | null = null;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        setDisplayValue(current);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    }, [value]);

    return <span>{displayValue}</span>;
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSave = async () => {
    if (!user) return;
    const result = await trackInteraction(user.uid, itemId, 'save', 'pitch');
    if (result !== null) {
      setIsSaved(result);
      if (result) triggerEffect('shooting-star', 8);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0) setIsMuted(false);
      else setIsMuted(true);
    }
  };

  const currentVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 0.5) return <Volume2 className="w-4 h-4 opacity-70" />;
    return <Volume2 className="w-4 h-4" />;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
      if (!duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      const newTime = (val / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(val);
    }
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const currentCaption = useMemo(() => {
    const caps = MOCK_CAPTIONS[language] || MOCK_CAPTIONS.en;
    const index = Math.min(Math.floor((progress / 100) * caps.length), caps.length - 1);
    return caps[index];
  }, [progress, language]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md overflow-hidden">
      {/* Main Content: The PDF */}
      <div className="flex w-full h-full max-w-7xl gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex-1 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          <iframe src={`${deckUrl}#toolbar=0`} className="w-full h-full border-none" title="Pitch Deck" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-2xl hover:bg-red-500 transition-all z-[130] border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </motion.div>

        {/* Boardroom & Metrics Side Panels */}
        <AnimatePresence mode="wait">
          {activePanel !== 'none' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-96 bg-zinc-900/90 backdrop-blur-3xl border border-white/5 rounded-2xl flex flex-col shadow-2xl relative z-[130]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activePanel === 'metrics' ? <Activity className="w-5 h-5 text-orange-500" /> : <MessageSquare className="w-5 h-5 text-blue-500" />}
                  <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
                    {activePanel === 'metrics' ? 'Neural Metrics' : 'Boardroom'}
                  </h3>
                </div>
                <button onClick={() => setActivePanel('none')} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activePanel === 'metrics' ? (
                  <div className="space-y-8">
                    {[
                      { label: 'Deal Momentum', value: simulatedMetrics.momentum, icon: TrendingUp, color: 'text-orange-500', barCol: 'bg-orange-500' },
                      { label: 'Strategic Density', value: simulatedMetrics.burnVelocity, icon: Zap, color: 'text-blue-500', barCol: 'bg-blue-500' },
                      { label: 'Engagement Alpha', value: simulatedMetrics.engagement, icon: BarChart3, color: 'text-emerald-500', barCol: 'bg-emerald-500' }
                    ].map((m, i) => (
                      <div key={i} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <m.icon className={`w-4 h-4 ${m.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{m.label}</span>
                          </div>
                          <span className="text-xl font-black italic text-white"><AnimatedNumber value={m.value} />%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.value}%` }}
                            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                            className={`h-full ${m.barCol} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-8 border-t border-white/5">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2 leading-relaxed">
                            Neural Intelligence predicts 84% probability of Series A attainment within 12 months based on velocity clusters.
                         </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CommentSection itemId={itemId} standalone />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced PIP Component */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={containerRef}
        className={`fixed z-[120] overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-move group transition-all duration-500 ${
          isPip 
            ? 'w-80 aspect-[16/10] bottom-24 right-12 scale-100' 
            : 'w-[400px] aspect-[16/10] bottom-32 left-1/2 -translate-x-1/2'
        }`}
      >
        <div className="relative w-full h-full bg-black">
          <video 
            ref={videoRef}
            src={videoSrc} 
            poster={thumbnailUrl}
            autoPlay 
            loop 
            muted={isMuted}
            playsInline 
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover" 
          />
          
          {/* Simulated Auto-Captions in PIP */}
          <AnimatePresence>
            {showCaptions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 left-4 right-4 px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl text-center pointer-events-none border border-white/5"
              >
                <p className="text-[10px] font-medium leading-tight text-white/90">
                  <span className="text-orange-500 font-black mr-2 uppercase">{language}:</span>
                  {currentCaption}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrubber overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 group-hover:h-3 transition-all z-10">
            <div 
              className="absolute top-0 left-0 h-full bg-orange-500"
              style={{ width: `${progress}%` }}
            />
            <input 
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleScrub}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Hover Controls */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Live Stream // PIP Node</span>
                <span className="text-[10px] font-bold text-white italic">{founderName}'s Pitch</span>
              </div>
              <button 
                onClick={() => setIsPip(!isPip)}
                className="p-2 bg-black/60 rounded-xl hover:bg-orange-500 transition-all border border-white/10"
              >
                {isPip ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={togglePlay} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
              </button>
            </div>

            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl group/volume">
                  <button 
                    onClick={() => {
                      const newMuted = !isMuted;
                      setIsMuted(newMuted);
                      if (videoRef.current) videoRef.current.muted = newMuted;
                    }} 
                    className="p-1.5 hover:text-orange-500 transition-colors"
                  >
                    {currentVolumeIcon()}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover:w-20 transition-all duration-300 accent-orange-500 h-1 cursor-pointer"
                  />
                </div>
                
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 bg-black/40 rounded-xl hover:text-orange-500 transition-colors opacity-100"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button onClick={toggleSpeed} className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-colors ${
                  playbackSpeed !== 1 ? 'bg-orange-500 text-white' : 'bg-black/40 text-zinc-400 hover:text-orange-500'
                }`}>
                  {playbackSpeed}x
                </button>
              </div>
              <div className="flex gap-2 relative">
                <button 
                  onClick={() => setShowLangPicker(!showLangPicker)} 
                  className={`p-1.5 rounded-lg transition-all bg-black/40 hover:bg-white/10 ${showLangPicker ? 'text-orange-500 scale-110' : 'text-zinc-500'}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                  {showLangPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full right-0 mb-3 w-32 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1"
                    >
                      <div className="px-2 py-1.5 border-b border-white/5 mb-1">
                        <p className="text-[6px] font-black uppercase tracking-widest text-zinc-500">Audio Stream</p>
                      </div>
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLanguage(l.code); setShowLangPicker(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center justify-between ${
                            language === l.code ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{l.name}</span>
                          {language === l.code && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={() => setShowCaptions(!showCaptions)} className={`p-1.5 bg-black/40 rounded-lg transition-colors hover:bg-white/10 ${showCaptions ? 'text-orange-500' : 'text-zinc-500'}`}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <div className="w-12 h-12 rounded-full border border-orange-500/0 group-active:border-orange-500/50 group-active:scale-150 transition-all duration-500 animate-ping opacity-0 group-active:opacity-100" />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showComments && (
          <CommentSection 
            itemId={itemId} 
            onClose={() => setShowComments(false)} 
          />
        )}
      </AnimatePresence>
      
      <div className="w-full max-w-6xl p-6 bg-zinc-950/80 backdrop-blur-md border-x border-b border-white/5 flex justify-between items-center rounded-b-2xl shadow-2xl z-[125]">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1">Enhanced Pitch Investigation Mode</p>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{founderName} // {category} // Decrypted</p>
                  <div className="w-1 h-1 rounded-full bg-zinc-700" />
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Rating:</span>
                    <span className="text-[9px] font-mono text-white font-bold">{rating.toFixed(1)}/5.0</span>
                  </div>
                  {funding_goal && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-zinc-700" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Goal:</span>
                        <span className="text-[9px] font-mono text-white font-bold">${funding_goal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Strategic Match for DeckViewer */}
            <div className="h-10 w-px bg-white/10 hidden md:block" />
            
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="relative w-8 h-8">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/5" />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="88"
                    initial={{ strokeDashoffset: 88 }}
                    animate={{ strokeDashoffset: 88 - (88 * (85 + (parseInt(itemId.substring(0, 5)) || 10) % 15)) / 100 }}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[7px] font-black tracking-tighter text-blue-500">{85 + (parseInt(itemId.substring(0, 5)) || 10) % 15}%</span>
                </div>
              </div>
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Strategic match</p>
                <p className="text-[9px] font-bold text-white uppercase tracking-tighter">High Alignment</p>
              </div>
            </div>
         </div>
         <div className="flex gap-4 items-center">
            <button 
              onClick={toggleSave}
              className={`p-3 rounded-2xl border transition-all ${
                isSaved 
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title={isSaved ? "Remove Bookmark" : "Save Pitch"}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'metrics' ? 'none' : 'metrics')}
              className={`p-3 rounded-2xl border transition-all ${
                activePanel === 'metrics' 
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Pitch Metrics"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActivePanel(activePanel === 'boardroom' ? 'none' : 'boardroom')}
              className={`text-[10px] font-black transition-all flex items-center gap-3 uppercase tracking-widest border px-6 py-3 rounded-2xl ${
                activePanel === 'boardroom'
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 bg-white/5 border-white/10 hover:text-blue-500 hover:bg-white/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Boardroom Discussion
            </button>
            <button className="text-[10px] font-black text-zinc-400 hover:text-orange-500 transition-all flex items-center gap-3 uppercase tracking-widest bg-white/5 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/10">
              <Download className="w-4 h-4" />
              Capture Document
            </button>
         </div>
      </div>
    </div>
  );
}
