import React, { useState, useRef, useMemo } from 'react';
import { DollarSign, Target, MessageSquare, ExternalLink, Bookmark, Download, Music, Video, Linkedin, Play, Pause, Volume2, VolumeX, Share2, Globe, MessageSquareQuote, Twitter, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExportModal } from '../shared/ExportModal';
import { ShareModal } from '../shared/ShareModal';
import { motion, AnimatePresence } from 'motion/react';
import { trackInteraction } from '@/src/lib/analytics';
import { useAuth } from '@/src/context/AuthContext';

export interface Intrestor {
  id: string;
  investor_name: string;
  firm_name: string;
  video_url: string;
  thumbnail_url?: string;
  focus_industries: string[];
  min_check: string;
  max_check: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
];

const MOCK_CAPTIONS: Record<string, string[]> = {
  en: ["We back transformative platform shifts.", "Looking for resilient founders in deep tech.", "Typical ticket size is $500k to $5M.", "Contact us for a sync."],
  es: ["Apoyamos cambios de plataforma transformadores.", "Buscamos fundadores resilientes en tecnología profunda.", "El tamaño típico del ticket es de 500.000 a 5 millones de dólares.", "Contáctenos para una sincronización."],
  fr: ["Nous soutenons les changements de plateforme transformateurs.", "Recherche de fondateurs résilients dans la deep tech.", "La taille typique du ticket est de 500 000 $ à 5 M $.", "Contactez-nous pour une synchronisation."],
  zh: ["我们支持变革性的平台转型。", "在深科技领域寻找有韧性的创始人。", "典型的投资额为 50 万至 500 万美元。", "联系我们进行同步。"],
};

export const IntrestorCard: React.FC<{ intrestor: Intrestor }> = ({ intrestor }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
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
        // Track view when they press play
        if (user?.uid) {
          trackInteraction(user.uid, intrestor.id, 'view', 'intrestor');
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    
    const result = await trackInteraction(user.uid, intrestor.id, 'save', 'intrestor');
    if (result !== null) {
      setIsSaved(result);
    }
  };

  return (
    <div className="relative group mb-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-500">
      {/* Mini Video Preview / Thumbnail */}
      <div className="relative h-48 w-full bg-zinc-800 overflow-hidden group/video">
        <video 
          ref={videoRef}
          src={intrestor.video_url} 
          poster={intrestor.thumbnail_url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
          muted={isMuted}
          loop 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Captions Overlay */}
        <AnimatePresence>
          {showCaptions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-12 left-0 right-0 px-4 flex justify-center z-10 pointer-events-none"
            >
              <p className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white text-center font-medium max-w-[80%] leading-tight border border-white/5">
                {currentCaption}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        
        {/* Custom Video Controls */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
          <button 
            onClick={togglePlay}
            className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current" />}
          </button>
        </div>

        {/* Right Tab Controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover/video:opacity-100 transition-opacity">
           <button 
            onClick={(e) => { e.stopPropagation(); setShowCaptions(!showCaptions); }}
            className={`p-1.5 backdrop-blur-md rounded-lg border transition-all hover:scale-110 active:scale-95 ${
              showCaptions ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/50 border-white/10 text-white/70'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowLangPicker(!showLangPicker); }}
              className={`p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 ${showLangPicker ? 'bg-blue-600 border-blue-500 text-white' : ''}`}
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
            {showLangPicker && (
              <div className="absolute bottom-0 right-10 w-24 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={(e) => { e.stopPropagation(); setLanguage(l.code); setShowLangPicker(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors ${
                      language === l.code ? 'text-blue-400 bg-blue-500/5' : 'text-zinc-500'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        
        {/* Top Controls */}
        <div className="absolute top-3 right-3 flex gap-2 z-20">
           <button 
             onClick={handleSave}
             className={`p-2 rounded-full backdrop-blur-md border transition-all ${
               isSaved ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/50 border-white/10 text-white/70 hover:text-white'
             }`}
           >
             <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
           </button>
           <button 
             onClick={() => setIsShareOpen(true)}
             className="p-2 rounded-full backdrop-blur-md border bg-black/50 border-white/10 text-white/70 hover:text-white transition-all"
           >
             <Share2 className="w-4 h-4" />
           </button>
           <div className="relative">
             <button 
               onClick={() => setShowDownload(!showDownload)}
               className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                 showDownload ? 'bg-white border-white text-black' : 'bg-black/50 border-white/10 text-white/70 hover:text-white'
               }`}
             >
               <Download className="w-4 h-4" />
             </button>
             
             {showDownload && (
               <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-mono text-zinc-500 px-3 py-2 uppercase tracking-widest border-b border-zinc-800 mb-1">Export Format (Watermarked)</p>
                  <button 
                    onClick={() => { setIsExportOpen(true); setShowDownload(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg text-xs transition-colors text-left group"
                  >
                    <Video className="w-4 h-4 text-blue-500" />
                    <span>Video (MP4)</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg text-xs transition-colors text-left group">
                    <Music className="w-4 h-4 text-emerald-500" />
                    <span>Audio Only (MP3)</span>
                  </button>
               </div>
             )}
           </div>
        </div>

        <div className="absolute bottom-3 left-4">
          <p className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.2em] mb-1">Intrestor Active</p>
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-xl tracking-tight">{intrestor.firm_name}</h4>
            <div className="flex gap-1.5 z-30">
               <a href={intrestor.linkedin_url || "#"} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-blue-500 transition-colors"><Linkedin className="w-3 h-3" /></a>
               <a href={intrestor.twitter_url || "#"} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-sky-400 transition-colors"><Twitter className="w-3 h-3" /></a>
               <a href={intrestor.github_url || "#"} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors"><Github className="w-3 h-3" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Intrestor Details */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <Link to={`/profile/${intrestor.id}`} className="flex items-center gap-2 group/link">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white group-hover/link:bg-blue-500 transition-colors">
              {intrestor.investor_name.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-zinc-200 group-hover/link:text-white transition-colors">{intrestor.investor_name}</span>
          </Link>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="p-1.5 bg-emerald-500/10 rounded">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-zinc-300 font-mono tracking-tight font-bold">${intrestor.min_check} — ${intrestor.max_check}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="p-1.5 bg-blue-500/10 rounded">
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {intrestor.focus_industries.map(tag => (
                <span key={tag} className="text-[10px] bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-black rounded-lg transition-all border border-blue-600/20 active:scale-95">
              <MessageSquare className="w-3.5 h-3.5" />
              DM INTRESTOR
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black rounded-lg transition-all border border-zinc-700 active:scale-95">
              <ExternalLink className="w-3.5 h-3.5" />
              PORTFOLIO
            </button>
          </div>
          
          <button 
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all border active:scale-[0.98] ${
              isSaved ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'SAVED FOR LATER' : 'SAVE FOR LATER'}</span>
          </button>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        title={`${intrestor.firm_name} // Intrestor Export`}
        defaultWatermark={intrestor.investor_name}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        companyName={intrestor.firm_name}
        shareUrl={`https://voltaire.vc/intrestor/${intrestor.id}`}
      />
    </div>
  );
};
