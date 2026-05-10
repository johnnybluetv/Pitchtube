import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Share2, Info, Handshake, Download, Music, Video, Bookmark, Linkedin, Play, Pause, Volume2, VolumeX, Globe, MessageSquareQuote, Twitter, Github, AlertTriangle, MessageCircle, RotateCcw, RotateCw, MonitorPlay, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBurnMeter } from '@/src/hooks/useBurnMeter';
import { DeckViewer } from './DeckViewer';
import { ExportModal } from '../shared/ExportModal';
import { ShareModal } from './ShareModal';
import { CommentSection } from './CommentSection';
import { trackInteraction } from '@/src/lib/analytics';
import { useAuth } from '@/src/context/AuthContext';
import { GiftOverlay } from '../wallet/GiftOverlay';
import { Gift, Check, Loader2 } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { notifyInvestmentInterest } from '@/src/services/emailService';
import { triggerEffect } from '../shared/StarEffect';

import { LANGUAGES, MOCK_CAPTIONS } from '@/src/constants';

export interface Pitch {
  id: string;
  video_url?: string;
  audio_url?: string;
  mediaType?: 'video' | 'audio';
  thumbnail_url?: string;
  deck_url?: string;
  founder_name: string;
  company_name: string;
  burn_count: number;
  tier: '30s' | '1m' | '3m';
  founderId?: string;
  category?: string;
  rating?: number;
  funding_goal?: string;
  isFavorite?: boolean;
  shareCount?: number;
  tags?: string[];
  interestedInvestor?: {
    id: string;
    name: string;
    firm: string;
    avatar?: string;
  };
  metrics?: {
    engagement: number;
    burnVelocity: number;
    strategicAlignment: number;
  };
}

export const PitchCard: React.FC<{ pitch: Pitch }> = ({ pitch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { burns, triggerBurn, isBurning } = useBurnMeter(pitch.id, pitch.burn_count);
  
  const handleBurn = () => {
    triggerBurn();
    triggerEffect('shooting-star', 3);
  };
  const { user } = useAuth();
  const [shareCount, setShareCount] = useState(pitch.shareCount || (parseInt(pitch.id.substring(0, 3), 16) % 256) + 12);
  const [intersecting, setIntersecting] = useState(false);
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isGiftingOpen, setIsGiftingOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isConnecting || isConnected) return;

    setIsConnecting(true);
    try {
      triggerEffect('shooting-star', 15);
      // 1. Fetch founder data for notification settings and email
      const founderRef = doc(db, 'users', pitch.founderId || '');
      const founderSnap = await getDoc(founderRef);
      
      if (founderSnap.exists()) {
        const founderData = founderSnap.data();
        const notificationSettings = founderData.notificationSettings || {};
        
        // 2. Only send if user hasn't explicitly disabled it
        if (notificationSettings.emailInvestments !== false) {
          await notifyInvestmentInterest(
            user.displayName || user.email || 'An Investor',
            founderData.email
          );
        }
      }
      
      setIsConnected(true);
      // Automatically reset after 3 seconds for demo/loop feel
      setTimeout(() => setIsConnected(false), 3000);
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
          // Track view when it comes into view
          if (user?.uid) {
            trackInteraction(user.uid, pitch.id, 'view', 'pitch');
          }
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

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

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    // Show a temporary indicator
    setShowSpeedIndicator(true);
    setTimeout(() => setShowSpeedIndicator(false), 1500);
  };

  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const MAX_RETRIES = 5;
  const [retryTimer, setRetryTimer] = useState(0);
  const [totalWaitTime, setTotalWaitTime] = useState(0);

  const handleVideoError = () => {
    if (retryCount >= MAX_RETRIES) {
      setHasError(true);
      setIsRetrying(false);
      return;
    }
    
    // Exponential backoff: 2, 4, 8, 16, 32 seconds
    const nextWaitTime = Math.pow(2, retryCount + 1);
    setTotalWaitTime(nextWaitTime);
    setHasError(true);
    setRetryTimer(nextWaitTime);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (retryTimer > 0 && hasError) {
      interval = setInterval(() => {
        setRetryTimer(prev => prev - 1);
      }, 1000);
    } else if (retryTimer === 0 && hasError && retryCount < MAX_RETRIES && !isRetrying) {
      handleRetry();
    }
    return () => clearInterval(interval);
  }, [retryTimer, hasError, retryCount, isRetrying]);

  const handleRetry = () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
    
    if (videoRef.current) {
      // Small delay before loading to ensure state propagates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(() => {
            // If play fails immediately after load, handleVideoError will catch it
          });
        }
        setIsRetrying(false);
      }, 800);
    }
  };

  const currentCaption = useMemo(() => {
    const caps = MOCK_CAPTIONS[language] || MOCK_CAPTIONS.en;
    const index = Math.min(Math.floor((progress / 100) * caps.length), caps.length - 1);
    return caps[index];
  }, [progress, language]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    
    const result = await trackInteraction(user.uid, pitch.id, 'save', 'pitch');
    if (result !== null) {
      setIsSaved(result);
      if (result) triggerEffect('shooting-star', 8);
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const togglePip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (videoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.error("PIP failed:", err);
    }
  };

  const handleShare = async () => {
    try {
      const pitchRef = doc(db, 'pitches', pitch.id);
      await updateDoc(pitchRef, {
        shareCount: increment(1)
      });
      setShareCount(prev => prev + 1);
      triggerEffect('shooting-star', 5);
    } catch (err) {
      console.error("Failed to update share count:", err);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsDeckOpen(true)}
        className="relative h-[85vh] w-full bg-zinc-900 mb-8 rounded-[3rem] overflow-hidden group border border-zinc-800 transition-all duration-500 hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.15)] cursor-pointer"
      >
        {/* Investor Favorite Tag */}
        {(pitch.rating || 0) > 4.7 && (
          <div className="absolute top-24 right-6 z-[45] animate-in fade-in zoom-in duration-500">
             <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400">
                <Target className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Investor Favorite</span>
             </div>
          </div>
        )}

        {/* Interested Investor Indicator */}
        {pitch.interestedInvestor && (
          <div className="absolute top-24 left-6 z-[45] animate-in slide-in-from-left-4 duration-700">
            <div className="group/investor bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-1 pr-4 py-1 flex items-center gap-2.5 hover:border-blue-500/50 transition-all cursor-help">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-lg shadow-blue-500/20">
                {pitch.interestedInvestor.avatar ? (
                  <img src={pitch.interestedInvestor.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  pitch.interestedInvestor.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-400">Investor Interest</span>
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[9px] font-bold text-white uppercase tracking-tight leading-none">
                  {pitch.interestedInvestor.name} <span className="text-zinc-500 font-medium">@{pitch.interestedInvestor.firm}</span>
                </p>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute top-full left-0 mt-3 opacity-0 group-hover/investor:opacity-100 transition-all pointer-events-none z-50">
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 shadow-2xl w-64 backdrop-blur-3xl">
                   <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                         <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Thesis Match</p>
                        <p className="text-xs font-bold text-white italic">Active engagement detected.</p>
                      </div>
                   </div>
                   <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                      <span className="text-blue-400 font-bold">{pitch.interestedInvestor.name}</span> recently analyzed this node's performance metrics and strategic density.
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Active Highlight Glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1),transparent_70%)] transition-opacity duration-1000 pointer-events-none" />
        {/* Video or Audio Layer */}
        {pitch.mediaType === 'audio' ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-950 p-12 relative overflow-hidden">
             {/* Audio Background Visualizer (Animated) */}
             <div className="absolute inset-x-0 bottom-0 h-64 flex items-end justify-center gap-1 opacity-20">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: isPlaying ? [20, Math.random() * 200 + 40, 20] : 20 }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                    className="w-1.5 bg-orange-500 rounded-full"
                  />
                ))}
             </div>

             {/* Center Disc Representation */}
             <div className="relative z-10">
                <motion.div 
                   animate={{ rotate: isPlaying ? 360 : 0 }}
                   transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                   className="w-64 h-64 rounded-full bg-zinc-900 border-8 border-white/5 flex items-center justify-center relative shadow-[0_0_100px_rgba(249,115,22,0.15)]"
                >
                   <div className="w-16 h-16 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center z-10">
                      <Music className="w-6 h-6 text-orange-500" />
                   </div>
                   <img src={pitch.thumbnail_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pitch.company_name}`} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-40 mix-blend-overlay" alt="" />
                </motion.div>
                
                <div className="mt-12 text-center">
                   <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">{pitch.company_name}</h3>
                   <div className="flex items-center justify-center gap-3">
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black uppercase text-blue-500 tracking-widest">Audio Pitch</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{pitch.founder_name}</span>
                   </div>
                </div>
             </div>

             <audio
                ref={videoRef as any}
                src={pitch.audio_url || pitch.video_url}
                className="hidden"
                loop
                onTimeUpdate={handleTimeUpdate}
                onError={handleVideoError}
                onLoadedData={() => { setHasError(false); setRetryCount(0); }}
             />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={pitch.video_url}
            poster={pitch.thumbnail_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"}
            className="h-full w-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            onLoadedData={() => { setHasError(false); setRetryCount(0); }}
          />
        )}

      {/* Speed Indicator Toast */}
      <AnimatePresence>
        {showSpeedIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-3 pointer-events-none"
          >
            <span className="text-2xl font-black italic text-orange-500">{playbackSpeed}X</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Playback Speed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {(hasError || isRetrying) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <div className={`w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${isRetrying ? 'animate-pulse border-orange-500/50' : ''}`}>
                <Video className={`w-10 h-10 ${isRetrying ? 'text-orange-500' : 'text-zinc-600'}`} />
              </div>
              {isRetrying && (
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>

              <div className="space-y-4 max-w-sm">
                <h4 className="text-white font-black uppercase italic tracking-tighter text-2xl">
                   {isRetrying ? 'Re-establishing Uplink' : 
                    retryCount >= MAX_RETRIES ? 'Uplink Signal Lost' : 'Network Buffer Underflow'}
                </h4>
                
                <p className="text-zinc-400 text-xs font-medium">
                  {isRetrying ? 'Synchronizing neural data packets for seamless transmission...' : 
                   retryCount >= MAX_RETRIES ? 'Critical transmission failure. The source node is unresponsive after multiple attempts. Please check your connection or try again later.' : 
                   `A packet collision occurred. Initializing exponential recovery (Attempt ${retryCount + 1}/${MAX_RETRIES}).`}
                </p>
                
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                  {isRetrying ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                      Re-routing Stream...
                    </span>
                  ) : (
                    <>
                      {retryCount >= MAX_RETRIES ? (
                        <span className="text-red-500 font-bold">STATUS: TERMINAL_FAILURE_0X42</span>
                      ) : (
                        `Retry Delay: ${retryTimer}s (Backoff Factor: 2^${retryCount + 1})`
                      )}
                    </>
                  )}
                </div>

                {!isRetrying && (
                  <div className="pt-4 space-y-4">
                    {retryTimer > 0 && retryCount < MAX_RETRIES && (
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: totalWaitTime, ease: "linear" }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                          Auto-Reconnect Sequence: {retryTimer}s
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                       <button 
                        onClick={(e) => { e.stopPropagation(); setRetryCount(0); handleRetry(); }}
                        className={`group px-8 py-3 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                          retryCount >= MAX_RETRIES ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-orange-600 text-white hover:bg-orange-500'
                        }`}
                      >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20 group-hover:h-full transition-all duration-300 -translate-x-full group-hover:translate-x-0" />
                        <Video className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{retryCount >= MAX_RETRIES ? 'Re-initialize Node' : 'Bypass Backoff & Retry'}</span>
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsReporting(true); setTimeout(() => setIsReporting(false), 2000); }}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isReporting ? 'Log Dispatched' : 'Report Payload Failure'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            {/* Matrix-like stats on corners */}
            {!isRetrying && (
              <div className="absolute inset-0 p-6 pointer-events-none opacity-20">
                <div className="absolute top-6 left-6 text-[8px] font-mono text-orange-500 uppercase">SYS_ERR_V0{retryCount}</div>
                <div className="absolute top-6 right-6 text-[8px] font-mono text-zinc-500">MT_BUFF_LIMIT: EXCEEDED</div>
                <div className="absolute bottom-6 left-6 text-[8px] font-mono text-zinc-500 uppercase">Pckt-Loss: 98.4%</div>
                <div className="absolute bottom-6 right-6 text-[8px] font-mono text-zinc-500 uppercase">Latency: ∞ms</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Captions Overlay */}
      <AnimatePresence>
        {showCaptions && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-32 left-0 right-0 px-8 flex justify-center z-20 pointer-events-none"
          >
            <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 max-w-sm text-center">
              <p className="text-white text-sm font-medium tracking-tight leading-relaxed drop-shadow-lg">
                {currentCaption}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Progress Bar / Scrubber */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-40 group/scrub">
        <div 
          className="absolute top-0 left-0 h-full bg-orange-500/30 transition-all group-hover/scrub:bg-orange-500 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
        <input 
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleScrub}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer accent-orange-500"
        />
      </div>

      {/* Main Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={togglePlay}
          className="p-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white fill-current" />
          ) : (
            <Play className="w-8 h-8 text-white fill-current" />
          )}
        </button>
      </div>

      {/* Right Side Video Controls */}
      <div className="absolute bottom-24 right-6 z-20 flex flex-col gap-3">
        {/* Comments Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          className={`p-3 backdrop-blur-md rounded-full border transition-all hover:scale-110 active:scale-95 ${
            showComments ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/60 border-white/10 text-white/50'
          }`}
        >
          <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Caption Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowCaptions(!showCaptions); }}
          className={`p-3 backdrop-blur-md rounded-full border transition-all hover:scale-110 active:scale-95 ${
            showCaptions ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-black/60 border-white/10 text-white/50'
          }`}
        >
          <MessageSquareQuote className="w-5 h-5" />
        </button>

        {/* Language/Translation */}
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowLangPicker(!showLangPicker); }}
            className={`p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 group ${showLangPicker ? 'border-orange-500 scale-110 ring-4 ring-orange-500/10' : ''}`}
          >
            <Globe className={`w-5 h-5 transition-transform ${showLangPicker ? 'rotate-12 text-orange-500' : 'group-hover:rotate-12'}`} />
          </button>
          
          <AnimatePresence>
            {showLangPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 10, y: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10, y: 10 }}
                className="absolute bottom-0 right-14 w-40 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
              >
                <div className="p-3 border-b border-white/5 bg-white/5">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Select Dialect</p>
                </div>
                <div className="p-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={(e) => { e.stopPropagation(); setLanguage(l.code); setShowLangPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-between group/lang ${
                        language === l.code ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{l.name}</span>
                      {language === l.code && <div className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Seek Backward */}
        <button 
          onClick={(e) => { e.stopPropagation(); seek(-10); }}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          title="Rewind 10s"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Seek Forward */}
        <button 
          onClick={(e) => { e.stopPropagation(); seek(10); }}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          title="Forward 10s"
        >
          <RotateCw className="w-5 h-5" />
        </button>

        {/* Mute Toggle */}
        <button 
          onClick={toggleMute}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* PIP Toggle */}
        <button 
          onClick={togglePip}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          title="Picture in Picture"
        >
          <MonitorPlay className="w-5 h-5" />
        </button>

        {/* Speed Toggle */}
        <button 
          onClick={toggleSpeed}
          className={`p-3 backdrop-blur-md rounded-full border transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center min-w-[46px] ${
            playbackSpeed !== 1 ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <span className="text-[10px] font-black italic tracking-tighter leading-none">{playbackSpeed}X</span>
        </button>
      </div>

      {/* Strategic Match Indicator (Investor specific feature) */}
      <div className="absolute top-20 left-6 z-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 group hover:border-blue-500/50 transition-all cursor-help"
          title="Strategic Alignment Score"
        >
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/5"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="125.6"
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 - (125.6 * (85 + (parseInt(pitch.id) % 15))) / 100 }}
                className="text-blue-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black tracking-tighter text-blue-500">{85 + (parseInt(pitch.id) % 15)}%</span>
            </div>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Strategic Match</p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-blue-500' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Overlay: Top Info */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-orange-600 px-2 py-1 rounded italic uppercase tracking-widest text-white">
              {pitch.tier} Pitch
            </span>
            <div className="flex gap-1">
              <a 
                href={pitch.linkedin_url || "https://linkedin.com"} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full backdrop-blur-md bg-black/50 text-white/50 hover:text-[#0077b5] border border-white/10 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a 
                href={pitch.twitter_url || "https://twitter.com"} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full backdrop-blur-md bg-black/50 text-white/50 hover:text-[#1DA1F2] border border-white/10 transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a 
                href={pitch.github_url || "https://github.com"} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full backdrop-blur-md bg-black/50 text-white/50 hover:text-white border border-white/10 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDownload(!showDownload); }}
              className={`text-white/70 hover:text-white transition-colors p-2 rounded-full ${showDownload ? 'bg-white text-black' : ''}`}
            >
              <Download className="w-5 h-5" />
            </button>
            
            {showDownload && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
                <p className="text-[9px] font-mono text-zinc-500 px-3 py-2 uppercase tracking-widest border-b border-zinc-800 mb-1 leading-tight">Founder Watermark: ON</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExportOpen(true); setShowDownload(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg text-xs transition-colors text-left text-white/80 hover:text-white"
                >
                  <Video className="w-4 h-4 text-orange-500" />
                  <span>Video (HD)</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-900 rounded-lg text-xs transition-colors text-left text-white/80 hover:text-white">
                  <Music className="w-4 h-4 text-blue-500" />
                  <span>Audio Analysis</span>
                </button>
              </div>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); setIsShareOpen(true); }}
              className={`p-2 rounded-full transition-all flex items-center gap-2 group ${isShareOpen ? 'bg-orange-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              title="Share Pitch Hub"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black mr-1">{shareCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Info Console */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent z-30">
        <div className="flex items-end justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <Link to={pitch.founderId ? `/profile/${pitch.founderId}` : "#"} className="inline-block group/link mb-2" onClick={(e) => !pitch.founderId && e.preventDefault()}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 group-hover/link:border-orange-500 transition-all overflow-hidden bg-zinc-800">
                    <img src={pitch.thumbnail_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pitch.founder_name}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic text-white group-hover/link:text-orange-400 transition-colors uppercase tracking-tighter leading-none">
                      {pitch.founder_name}
                    </h4>
                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">{pitch.company_name} // NODE_{pitch.id.substring(0,4)}</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Performance Node (Cohesive grouping) */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Pitch Tags */}
              <div className="flex flex-wrap gap-2 mb-4 w-full">
                {(pitch.tags || [pitch.category || 'Venture', 'Series A', 'B2B']).map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:border-orange-500/30 transition-all">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 pr-4 group/stats hover:border-orange-500/30 transition-all">
                <div className="flex flex-col items-center justify-center px-4 border-r border-white/10">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Tier</span>
                  <span className="text-sm font-black italic text-white uppercase tracking-tighter">{pitch.tier}</span>
                </div>
                
                <div className="flex items-center gap-4 pl-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBurn(); }}
                    className="relative flex items-center gap-3 group/burn_btn"
                  >
                    <AnimatePresence>
                      {isBurning && (
                        <motion.div
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -60, scale: 2 }}
                          className="absolute inset-0 flex justify-center text-orange-500 pointer-events-none"
                        >
                          <Flame fill="currentColor" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 group-hover/burn_btn:bg-orange-500 transition-all shadow-lg group-hover/burn_btn:shadow-orange-500/20">
                      <Flame 
                        className={`w-5 h-5 transition-colors ${burns > 1000 ? 'text-white fill-current' : 'text-orange-500 group-hover/burn_btn:text-white'}`} 
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white tabular-nums leading-none mb-0.5">{burns.toLocaleString()}</div>
                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Velocity Rate</div>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-white/10 ml-auto md:ml-0">
                  <div className="flex items-center gap-2 group/match animate-in fade-in slide-in-from-right-4 duration-1000">
                    <div className="relative w-9 h-9">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/5" />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray="100.5"
                          initial={{ strokeDashoffset: 100.5 }}
                          animate={{ strokeDashoffset: 100.5 - (100.5 * (85 + (parseInt(pitch.id.substring(0, 5)) || 10) % 15)) / 100 }}
                          className="text-orange-500"
                          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-orange-500 scale-0 group-hover/match:scale-110 transition-transform" />
                        <span className="text-[7.5px] font-black text-white group-hover/match:opacity-0 transition-opacity">{85 + (parseInt(pitch.id.substring(0, 5)) || 10) % 15}%</span>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Strategic</div>
                      <div className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Alignment</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleConnect}
                  disabled={isConnecting || isConnected}
                  className={`px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-2 ${
                    isConnected 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-400 hover:scale-[1.02] active:scale-95'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isConnecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isConnected ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : null}
                  {isConnecting ? 'Establishing Link' : isConnected ? 'Signal Dispatched' : 'Connect Founder'}
                </button>

                {pitch.funding_goal && (
                  <div className="px-6 py-3.5 rounded-2xl bg-zinc-900/60 border border-orange-500/30 flex flex-col justify-center gap-0.5 shadow-[0_0_20px_rgba(249,115,22,0.1)] group">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">Capital Target</span>
                    </div>
                    <span className="text-sm font-black text-white italic tracking-tighter group-hover:text-orange-500 transition-colors">
                      ${pitch.funding_goal.toLocaleString()}
                    </span>
                  </div>
                )}

                <button 
                  onClick={handleSave}
                  className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all ${
                    isSaved ? 'bg-white text-black border-white shadow-xl shadow-white/10' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsGiftingOpen(true); }}
                  className="p-3.5 rounded-2xl bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-500/10"
                >
                  <Gift className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History Ledger (Mini) */}
          <div className="hidden lg:block w-48 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-4 self-end">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Activity</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              {[
                { type: 'BURN', user: 'V. Angel', time: '2m', color: 'text-orange-500' },
                { type: 'GIFT', user: 'Seed_X', time: '14m', color: 'text-blue-500' },
                { type: 'VIEW', user: 'Founder_B', time: '1h', color: 'text-zinc-500' }
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between group/tx">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full bg-current ${tx.color} opacity-30`} />
                    <div>
                      <div className="text-[9px] font-black text-white uppercase leading-none mb-0.5">{tx.user}</div>
                      <div className="text-[7px] font-mono text-zinc-500">{tx.type} DETECTED</div>
                    </div>
                  </div>
                  <span className="text-[7px] font-mono text-zinc-600">{tx.time}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
              className="w-full mt-4 py-2 border-t border-white/5 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center hover:text-white transition-colors"
            >
              View Boardroom Discussion
            </button>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="p-4 rounded-full bg-black/40 border border-white/10 hover:border-white/30 transition-all self-end mb-1"
          >
            <Info className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </div>

      {/* Boardroom Comments Section */}
      <AnimatePresence>
        {showComments && (
          <CommentSection 
            itemId={pitch.id} 
            onClose={() => setShowComments(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeckOpen && (
        <DeckViewer 
          deckUrl={pitch.deck_url || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"} 
          videoSrc={pitch.audio_url || pitch.video_url || ""} 
          onClose={() => setIsDeckOpen(false)} 
          founderName={pitch.founder_name}
          itemId={pitch.id}
          category={pitch.category}
          rating={pitch.rating}
          funding_goal={pitch.funding_goal}
          thumbnailUrl={pitch.thumbnail_url}
        />
      )}
    </AnimatePresence>

    <ExportModal 
      isOpen={isExportOpen} 
      onClose={() => setIsExportOpen(false)} 
      title={`${pitch.company_name} // Pitch Export`}
      defaultWatermark={pitch.founder_name}
    />

    <ShareModal 
      isOpen={isShareOpen}
      onClose={() => setIsShareOpen(false)}
      onShare={handleShare}
      title={pitch.company_name}
      url={`https://voltaire.vc/pitch/${pitch.id}`}
    />

    <AnimatePresence>
      {isGiftingOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <GiftOverlay 
            targetUserId={pitch.founderId || ''} 
            targetName={pitch.founder_name} 
            onClose={() => setIsGiftingOpen(false)} 
          />
        </div>
      )}
    </AnimatePresence>
  </>
);
};
