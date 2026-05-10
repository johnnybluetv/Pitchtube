import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2, X, HardDrive, Youtube, Globe, Share2, Instagram, Music, Scissors, Play, Pause, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UploadSource = 'local' | 'drive' | 'url' | 'youtube' | 'social';

export function UploadPitchModal({ isOpen, onClose, type = 'pitch' }: { isOpen: boolean, onClose: () => void, type?: 'pitch' | 'intrestor' }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState<UploadSource>('local');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Monitor video playback and loop within trim range
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isEditing) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isEditing, trimStart, trimEnd]);

  const startSimulation = () => {
    setIsEditing(false);
    setError(null);
    setIsUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setIsComplete(true);
          }, 800);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024;
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a video (MP4, WebM, or MOV).');
      return;
    }

    if (file.size > maxSize) {
      setError('File too large. Maximum size is 100MB.');
      return;
    }

    // Set preview for editing
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsEditing(true);

    // Load metadata to get duration
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setVideoDuration(tempVideo.duration);
      setTrimStart(0);
      setTrimEnd(Math.min(tempVideo.duration, 30));
    };
  };

  const setTargetDuration = (seconds: number) => {
    if (videoDuration <= 0) return;
    const duration = Math.min(seconds, videoDuration);
    setTrimStart(0);
    setTrimEnd(duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    // For URL imports, we simulate a preview
    setPreviewUrl('https://cdn.coverr.co/videos/127/127_preview.mp4');
    setIsEditing(true);
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setIsComplete(false);
    setIsEditing(false);
    setSource('local');
    setUrlInput('');
    setError(null);
    setPreviewUrl(null);
    setTrimStart(0);
    setTrimEnd(30);
    setVideoDuration(0);
    setCurrentTime(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500 ${isEditing ? 'max-w-4xl w-full h-[700px]' : 'max-w-2xl w-full h-[600px] md:h-auto'}`}
          >
            {/* Sidebar: Sources */}
            {!isUploading && !isComplete && !isEditing && (
              <div className="w-full md:w-48 bg-zinc-950/50 border-r border-zinc-800 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'local', icon: Upload, label: 'Local' },
                  { id: 'drive', icon: HardDrive, label: 'Cloud' },
                  { id: 'youtube', icon: Youtube, label: 'YouTube' },
                  { id: 'url', icon: Globe, label: 'URL' },
                  { id: 'social', icon: Share2, label: 'Social' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSource(item.id as UploadSource)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap ${
                      source === item.id 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 p-8 flex flex-col justify-center relative">
              <button 
                onClick={handleClose} 
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-50"
                disabled={isUploading}
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center h-full justify-center">
                {!isUploading && !isComplete && !isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={source}
                    className="w-full"
                  >
                    <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mb-6 mx-auto rotate-3">
                      {source === 'local' && <Upload className="w-10 h-10 text-orange-500" />}
                      {source === 'drive' && <HardDrive className="w-10 h-10 text-orange-500" />}
                      {source === 'youtube' && <Youtube className="w-10 h-10 text-orange-500" />}
                      {source === 'url' && <Globe className="w-10 h-10 text-orange-500" />}
                      {source === 'social' && <Share2 className="w-10 h-10 text-orange-500" />}
                    </div>
                    
                    <h3 className="text-3xl font-black italic tracking-tighter mb-2 uppercase">
                      {source === 'local' ? 'Drop Local File' : 
                       source === 'drive' ? 'Cloud Sync' : 
                       source === 'youtube' ? 'Tube Import' : 
                       source === 'social' ? 'Social Clip' : 'URL Fetch'}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto">
                      {source === 'local' ? 'Optimal format: Vertical MP4 (9:16). Max 100MB.' : 
                       source === 'drive' ? 'Connect Google Drive or Dropbox to sync raw masters.' : 
                       source === 'youtube' ? 'Paste any YouTube or Vimeo link to ingest.' : 
                       source === 'social' ? 'Import from Instagram, TikTok, or Twitter.' : 'Direct HTTP/S link to a video file.'}
                    </p>
                    
                    {['local'].includes(source) ? (
                      <label className="cyber-button w-full !py-5 !bg-white !text-black !font-black !rounded-2xl cursor-pointer hover:!bg-zinc-200 text-center flex items-center justify-center gap-3">
                        <Upload className="w-5 h-5" />
                        SELECT MASTER FILE
                        <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                      </label>
                    ) : source === 'social' ? (
                       <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
                          <button onClick={handleUrlSubmit} className="flex items-center justify-center gap-3 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500 transition-colors group">
                             <Instagram className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Reels</span>
                          </button>
                          <button onClick={handleUrlSubmit} className="flex items-center justify-center gap-3 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500 transition-colors group">
                             <Music className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">TikTok</span>
                          </button>
                          <button onClick={handleUrlSubmit} className="flex items-center justify-center gap-3 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500 transition-colors group">
                             <Youtube className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Shorts</span>
                          </button>
                          <button onClick={handleUrlSubmit} className="flex items-center justify-center gap-3 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500 transition-colors group">
                             <Globe className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Website</span>
                          </button>
                       </div>
                    ) : (
                      <form onSubmit={handleUrlSubmit} className="space-y-4 w-full max-w-md mx-auto">
                        <div className="relative">
                           <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                           <input 
                            type="text" 
                            placeholder={source === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-orange-500 transition-all font-mono text-xs"
                           />
                        </div>
                        <button type="submit" className="cyber-button w-full !py-5 !bg-orange-500 !text-white !font-black !rounded-2xl shadow-lg shadow-orange-500/20">
                           INITIALIZE FETCH
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}

                {isEditing && previewUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex flex-col items-center gap-8"
                  >
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-orange-500">
                      {type === 'pitch' ? 'Pitch Editor // v1.0' : 'Intrestor Editor // v1.0'}
                    </h3>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-1">
                      {type === 'pitch' ? 'Trim your pitch to perfection' : 'Refine your investment thesis'}
                    </p>

                    <div className="relative w-64 aspect-[4/5] bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group">
                       <video 
                        ref={videoRef}
                        src={previewUrl} 
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                       />
                       <button 
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         {isPlaying ? <Pause className="w-12 h-12 text-white fill-current" /> : <Play className="w-12 h-12 text-white fill-current" />}
                       </button>
                    </div>

                    <div className="w-full max-w-2xl space-y-8">
                       {/* Duration Presets */}
                       <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: '30s', val: 30 },
                            { label: '1m', val: 60 },
                            { label: '3m', val: 180 },
                            { label: 'MAX', val: videoDuration }
                          ].map((d) => (
                            <button
                              key={d.label}
                              onClick={() => setTargetDuration(d.val)}
                              className={`py-3 rounded-xl border font-black text-[10px] tracking-[0.2em] transition-all ${
                                Math.abs((trimEnd - trimStart) - d.val) < 0.1 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-end mb-2">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Trim Range</span>
                                <span className="text-xl font-black font-mono text-orange-500">{formatTime(trimStart)} — {formatTime(trimEnd)}</span>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total Selection</span>
                                <span className="text-lg font-black font-mono text-white italic">{(trimEnd - trimStart).toFixed(1)}s</span>
                             </div>
                          </div>

                          <div className="relative h-16 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden px-2 flex items-center group/scrubber">
                             {/* Background Waveform Representation */}
                             <div className="absolute inset-0 flex items-center justify-around px-4 opacity-10 pointer-events-none">
                                {Array.from({ length: 80 }).map((_, i) => (
                                  <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${Math.random() * 80 + 10}%` }} />
                                ))}
                             </div>

                             {/* The Active Trim Window */}
                             <div 
                              className="absolute inset-y-0 bg-orange-500/10 border-x-4 border-orange-500 z-10 transition-all duration-300" 
                              style={{ 
                                left: `${(trimStart / videoDuration) * 100}%`, 
                                width: `${((trimEnd - trimStart) / videoDuration) * 100}%` 
                              }} 
                             >
                               <div className="absolute -top-1 -bottom-1 left-[-4px] w-2 bg-orange-400 rounded-full blur-[2px] opacity-0 group-hover/scrubber:opacity-100 transition-opacity" />
                               <div className="absolute -top-1 -bottom-1 right-[-4px] w-2 bg-orange-400 rounded-full blur-[2px] opacity-0 group-hover/scrubber:opacity-100 transition-opacity" />
                             </div>
                             
                             {/* Playhead */}
                             <div 
                                className="absolute inset-y-0 w-0.5 bg-white z-20 shadow-[0_0_10px_white]" 
                                style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                             />

                             <input 
                               type="range" 
                               min="0" 
                               max={videoDuration} 
                               step="0.1"
                               value={trimStart} 
                               onChange={(e) => {
                                 const val = parseFloat(e.target.value);
                                 const currentDur = trimEnd - trimStart;
                                 const newStart = Math.min(val, videoDuration - currentDur);
                                 setTrimStart(newStart);
                                 setTrimEnd(newStart + currentDur);
                               }}
                               className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
                             />
                          </div>

                          <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] px-1">
                             <span>00:00</span>
                             <div className="flex items-center gap-1 text-zinc-400">
                                <Clock className="w-3 h-3" />
                                <span>TOTAL DURATION: {formatTime(videoDuration)}</span>
                             </div>
                             <span>{formatTime(videoDuration)}</span>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <button 
                            onClick={reset}
                            className="flex-1 py-5 bg-zinc-950 border border-zinc-800 text-zinc-400 font-black rounded-2xl hover:bg-zinc-900 border-zinc-700 transition-all text-xs tracking-widest uppercase"
                          >
                            RESELECT
                          </button>
                          <button 
                            onClick={startSimulation}
                            className="flex-[2] py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 text-xs tracking-[0.2em] uppercase hover:bg-orange-500 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            <Scissors className="w-4 h-4" />
                            FINALIZE & DEPLOY PITCH
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}

                {isUploading && (
                  <div className="w-full py-10">
                    <div className="relative w-32 h-32 mx-auto mb-10">
                       <Loader2 className="w-32 h-32 text-orange-500 animate-spin absolute inset-0 opacity-20" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black italic tracking-tighter text-white">{progress}%</span>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Encoding</span>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full mb-6 overflow-hidden border border-zinc-800 max-w-sm mx-auto">
                      <motion.div 
                        className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500 animate-pulse">
                      {progress < 40 ? 'Trimming Video Frames...' : 
                       progress < 75 ? 'Re-encoding Stream...' : 
                       'Injecting Metadata...'}
                    </p>
                  </div>
                )}

                {isComplete && (
                  <div className="py-10">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-emerald-500/20 shadow-xl shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-3xl font-black italic tracking-tight mb-3 uppercase">
                      {type === 'pitch' ? 'Stream Live' : 'Thesis Published'}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-10 max-w-xs mx-auto">
                      {type === 'pitch' ? 'Your pitch has been trimmed and published to the global feed.' : 'Your investment thesis video is now active in the intrestor stream.'}
                    </p>
                    <button 
                      onClick={handleClose}
                      className="cyber-button w-full !py-5 !bg-white !text-black !font-black !rounded-2xl"
                    >
                      RETURN TO DASHBOARD
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
