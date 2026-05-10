import React, { useState, useRef, useEffect } from 'react';
import { Scissors, Play, Pause, Square, Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';

interface VideoClip {
  id: string;
  file: File;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface VideoEditorProps {
  files: File[];
  onComplete: (processedVideo: Blob | string) => void;
  onCancel: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ files, onComplete, onCancel }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preciseStart, setPreciseStart] = useState("");
  const [preciseEnd, setPreciseEnd] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const [isPreviewingAll, setIsPreviewingAll] = useState(false);
  const [transitionType, setTransitionType] = useState<'cut' | 'fade' | 'dissolve'>('cut');

  useEffect(() => {
    const initialClips = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      startTime: 0,
      endTime: 0,
      duration: 0
    }));
    setClips(initialClips);

    return () => {
      initialClips.forEach(clip => {
        if (clip.url.startsWith('blob:')) {
          URL.revokeObjectURL(clip.url);
        }
      });
    };
  }, [files]);

  const activeClip = clips[activeClipIndex];

  useEffect(() => {
    if (activeClip) {
      setPreciseStart(activeClip.startTime.toFixed(2));
      setPreciseEnd(activeClip.endTime.toFixed(2));
    }
  }, [activeClipIndex, clips]);

  const handlePreciseInput = (type: 'start' | 'end', val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (type === 'start' && num < activeClip.endTime) {
        handleTrimChange(num, activeClip.endTime);
      } else if (type === 'end' && num > activeClip.startTime && num <= activeClip.duration) {
        handleTrimChange(activeClip.startTime, num);
      }
    }
  };

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const duration = e.currentTarget.duration;
    if (isNaN(duration)) return;
    
    setClips(prev => prev.map((c, i) => 
      i === activeClipIndex && c.duration === 0 ? { ...c, duration, endTime: duration } : c
    ));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      if (isPreviewingAll) {
        if (time >= activeClip.endTime) {
          if (activeClipIndex < clips.length - 1) {
            const nextIndex = activeClipIndex + 1;
            setActiveClipIndex(nextIndex);
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.currentTime = clips[nextIndex].startTime;
                videoRef.current.play();
              }
            }, 0);
          } else {
            setIsPlaying(false);
            setIsPreviewingAll(false);
          }
        }
      } else {
        if (time >= activeClip.endTime) {
          videoRef.current.currentTime = activeClip.startTime;
          if (!isPlaying) videoRef.current.pause();
        }
      }
    }
  };

  const togglePreviewAll = () => {
    if (!isPreviewingAll) {
      setActiveClipIndex(0);
      setIsPreviewingAll(true);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = clips[0].startTime;
          videoRef.current.play();
        }
      }, 50);
    } else {
      setIsPreviewingAll(false);
      setIsPlaying(false);
      videoRef.current?.pause();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrimChange = (start: number, end: number) => {
    setClips(prev => prev.map((c, i) => 
      i === activeClipIndex ? { ...c, startTime: start, endTime: end } : c
    ));
  };

  const splitClip = () => {
    const newClips = [...clips];
    const original = clips[activeClipIndex];
    const splitPoint = videoRef.current?.currentTime || 0;

    const clip1 = { ...original, id: original.id + '-1', endTime: splitPoint };
    const clip2 = { ...original, id: original.id + '-2', startTime: splitPoint };

    newClips.splice(activeClipIndex, 1, clip1, clip2);
    setClips(newClips);
  };

  const removeClip = (index: number) => {
    if (clips.length <= 1) return;
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    setActiveClipIndex(Math.min(activeClipIndex, newClips.length - 1));
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const finishEditing = async () => {
    setIsProcessing(true);
    // Simulate complex video processing (Transcoding, Merging, Trimming)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // In a real app, this would use ffmpeg.wasm to actually merge/trim
    // For this demo, we'll return the first clip as a placeholder
    setIsProcessing(false);
    onComplete(clips[0].file);
  };

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-orange-500/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full bg-orange-500/10 blur-xl"
            />
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-2xl font-black uppercase italic tracking-tight italic">Rendering Masterpiece</h4>
            <div className="flex flex-col gap-1 items-center">
              <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Processing Clips: {clips.length} // Merge Engine: v4.2</p>
              <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Viewport */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
        <video
          ref={videoRef}
          src={activeClip?.url}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleMetadataLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm z-30">
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform border border-white/20"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
          </button>
        </div>

        {/* Transition Overlay Mock */}
        <AnimatePresence>
          {isPreviewingAll && currentTime >= activeClip?.endTime - 0.6 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-40 flex items-center justify-center p-8 text-center"
            >
               <div className="space-y-4">
                 <div className="text-[14px] font-black uppercase tracking-[0.4em] text-orange-500 animate-pulse">
                   Cross-Phase: {transitionType.toUpperCase()}
                 </div>
                 <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                   Synchronizing Neural Metadata...
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Time Code */}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg font-mono text-xs tracking-widest border border-white/10 uppercase">
          {currentTime.toFixed(2)}s / {activeClip?.duration.toFixed(2)}s
        </div>
      </div>

      {/* Editor Controls */}
      <div className="space-y-6">
        {/* Timeline Slider */}
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timeline / Clip Ref: {activeClip?.id.slice(0, 4)}</h4>
              <button 
                onClick={togglePreviewAll}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                  isPreviewingAll ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-zinc-500'
                }`}
              >
                {isPreviewingAll ? 'Stop Preview' : 'Preview Entire Sequence'}
              </button>
            </div>
            <div className="flex gap-2">
              <select 
                value={transitionType}
                onChange={(e) => setTransitionType(e.target.value as any)}
                className="bg-zinc-800 border border-white/10 text-[8px] font-black uppercase tracking-widest rounded-lg px-2 py-1.5 focus:outline-none focus:border-orange-500"
              >
                <option value="cut">Cut</option>
                <option value="fade">Fade</option>
                <option value="dissolve">Dissolve</option>
              </select>
              <button 
                onClick={splitClip}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-orange-500" />
                Split Here
              </button>
            </div>
          </div>

          <div className="relative h-16 bg-zinc-800 rounded-xl border border-white/5 overflow-hidden group">
            {/* Split Preview Needle */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)] z-20 pointer-events-none"
              style={{ left: `${activeClip?.duration ? (currentTime / activeClip.duration) * 100 : 0}%` }}
            />
            
            {/* Visual Waveform Mock */}
            <div className="absolute inset-0 flex items-end gap-1 px-4 opacity-20">
              {Array.from({ length: 60 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-full bg-orange-500 rounded-t-sm" 
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>

            {/* Trimming UI - Dual Handles */}
            <div className="absolute inset-x-0 inset-y-0 px-4">
              <div className="relative w-full h-full">
                {/* Visual Trimming Info */}
                <div className="absolute -top-12 left-0 right-0 flex justify-between px-2">
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Mark In</span>
                    <input 
                      type="text" 
                      value={preciseStart}
                      onChange={(e) => {
                        setPreciseStart(e.target.value);
                        handlePreciseInput('start', e.target.value);
                      }}
                      className="bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-orange-500 w-12 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Mark Out</span>
                    <input 
                      type="text" 
                      value={preciseEnd}
                      onChange={(e) => {
                        setPreciseEnd(e.target.value);
                        handlePreciseInput('end', e.target.value);
                      }}
                      className="bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-orange-500 w-12 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Start Handle */}
                <input 
                  type="range" 
                  min="0" 
                  max={activeClip?.duration || 100} 
                  step="0.01"
                  value={activeClip?.startTime || 0}
                  onChange={(e) => {
                    const start = parseFloat(e.target.value);
                    if (start < activeClip.endTime) handleTrimChange(start, activeClip.endTime);
                  }}
                  className="absolute inset-x-0 -top-1 w-full opacity-0 cursor-pointer z-30"
                />
                {/* End Handle */}
                <input 
                  type="range" 
                  min="0" 
                  max={activeClip?.duration || 100} 
                  step="0.01"
                  value={activeClip?.endTime || 0}
                  onChange={(e) => {
                    const end = parseFloat(e.target.value);
                    if (end > activeClip.startTime) handleTrimChange(activeClip.startTime, end);
                  }}
                  className="absolute inset-x-0 -bottom-1 w-full opacity-0 cursor-pointer z-30 flex items-end"
                />

                {/* Range Indicators Visuals */}
                <div 
                  className="absolute top-0 bottom-0 bg-orange-500/30 border-x-4 border-orange-500 z-10"
                  style={{ 
                    left: `${activeClip?.duration ? (activeClip.startTime / activeClip.duration) * 100 : 0}%`,
                    right: `${activeClip?.duration ? 100 - (activeClip.endTime / activeClip.duration) * 100 : 0}%`
                  }}
                >
                   {/* Handle icons */}
                   <div className="absolute top-1/2 -left-1 -translate-x-full -translate-y-1/2 p-1 bg-orange-500 rounded-l text-[8px] font-black">IN</div>
                   <div className="absolute top-1/2 -right-1 translate-x-full -translate-y-1/2 p-1 bg-orange-500 rounded-r text-[8px] font-black">OUT</div>
                </div>

                {/* Playhead */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-40 shadow-[0_0_15px_rgba(255,255,255,1)]"
                  style={{ left: `${activeClip?.duration ? (currentTime / activeClip.duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clip Bin (Merge UI) */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Clip Bin (Merge {clips.length} Clips)</h4>
          <Reorder.Group axis="x" values={clips} onReorder={setClips} className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {clips.map((clip, index) => (
              <Reorder.Item 
                key={clip.id} 
                value={clip}
                className={`flex-none w-32 aspect-video relative rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing overflow-hidden ${
                  index === activeClipIndex ? 'border-orange-500 shadow-lg shadow-orange-500/20 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
                onClick={() => setActiveClipIndex(index)}
              >
                <video src={clip.url} className="w-full h-full object-cover" />
                
                {/* Drag Handle Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                <div className="absolute top-1 left-1 p-1 bg-black/60 backdrop-blur-md rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-zinc-400" />
                </div>

                <div className="absolute top-1 right-1 flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeClip(index); }}
                    className="p-1 bg-black/60 backdrop-blur-md rounded-md hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-mono">
                  {(clip.endTime - clip.startTime).toFixed(1)}s
                </div>
              </Reorder.Item>
            ))}
            <button className="flex-none w-32 aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-orange-500 group transition-all text-zinc-500 hover:text-white">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Add Clip</span>
            </button>
          </Reorder.Group>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={finishEditing}
          className="flex-[2] py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          Generate Output
          <Scissors className="w-4 h-4" />
        </button>
      </div>
        </>
      )}
    </div>
  );
};
