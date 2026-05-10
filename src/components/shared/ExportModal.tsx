import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Shield, Type, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultWatermark: string;
}

export function ExportModal({ isOpen, onClose, title, defaultWatermark }: ExportModalProps) {
  const [step, setStep] = useState<'config' | 'processing' | 'complete'>('config');
  const [watermarkType, setWatermarkType] = useState<'text' | 'logo'>('text');
  const [watermarkText, setWatermarkText] = useState(defaultWatermark);
  const [progress, setProgress] = useState(0);
  const [exportRef, setExportRef] = useState(`PT-${Math.random().toString(36).substring(7).toUpperCase()}`);

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('complete'), 500);
            return 100;
          }
          return prev + Math.floor(Math.random() * 10) + 2;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleStartExport = () => {
    setStep('processing');
    setProgress(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black italic tracking-tight">{step === 'complete' ? 'EXPORT READY' : 'SECURE EXPORT'}</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{title}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {step === 'config' && (
                <div className="space-y-8">
                  {/* Configuration Area */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-4">Watermark Configuration</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setWatermarkType('text')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          watermarkType === 'text' ? 'border-orange-500 bg-orange-500/5 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <Type className="w-5 h-5" />
                        <span className="text-sm font-bold">Text Mark</span>
                      </button>
                      <button 
                        onClick={() => setWatermarkType('logo')}
                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          watermarkType === 'logo' ? 'border-orange-500 bg-orange-500/5 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-sm font-bold">Logo Asset</span>
                      </button>
                    </div>

                    {watermarkType === 'text' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Mark Content</label>
                        <input 
                          type="text" 
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
                          placeholder="Founder or Company Name"
                        />
                      </div>
                    ) : (
                      <div className="p-6 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3 bg-zinc-950/30">
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                        <p className="text-[10px] font-mono text-zinc-600 uppercase">Upload PNG Logo (Transparent)</p>
                        <button className="text-[10px] font-black text-orange-500 hover:underline">BROWSE ASSETS</button>
                      </div>
                    )}
                  </section>

                  {/* Preview Warning */}
                  <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      <span className="text-white font-bold block mb-1">PROTECTION ACTIVE</span>
                      The selected mark will be burned into the stream metadata and video layers. This process is irreversible for this export batch.
                    </p>
                  </div>

                  <button 
                    onClick={handleStartExport}
                    className="cyber-button w-full !py-4 !bg-orange-500 !text-white flex items-center justify-center gap-3 group"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    <span>INITIALIZE ENCODING</span>
                  </button>
                </div>
              )}

              {step === 'processing' && (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 mb-8">
                    <Loader2 className="w-full h-full text-orange-500 animate-spin absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black italic tracking-tighter">{progress}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold italic tracking-tight">ENCODING LAYERS</h4>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em]">
                      {progress < 30 ? 'Layering Watermark...' : 
                       progress < 60 ? 'Burning Metadata...' : 
                       progress < 90 ? 'Finalizing HLS Export...' : 
                       'Re-indexing Stream...'}
                    </p>
                  </div>

                  <div className="mt-8 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {step === 'complete' && (
                <div className="py-8 space-y-8 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase">Process Complete</h4>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-mono text-zinc-500">REF_ID: {exportRef}</p>
                      <p className="text-[10px] font-mono text-emerald-500 uppercase">Status: 100% Watermarked</p>
                    </div>
                  </div>

                  <div className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-left">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Asset Hash</p>
                      <p className="text-xs font-mono text-white truncate w-48">SHA256_{Math.random().toString(36).substring(2, 10).toUpperCase()}_ENCODED</p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        setStep('config');
                      }}
                      className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:underline"
                    >
                      CLEAR CACHE
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      // Trigger real download simulation
                      alert(`Downloading watermarked video: PT_${exportRef}.mp4`);
                      onClose();
                      setTimeout(() => setStep('config'), 500);
                    }}
                    className="cyber-button w-full !py-4 !bg-emerald-500 !text-white !font-black !rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    DOWNLOAD MP4 PACKAGE
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-black border-t border-zinc-800 flex justify-center">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">PitchTube Secure Encoder v4.0.1</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
