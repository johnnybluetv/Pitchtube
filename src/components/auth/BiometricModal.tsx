import React, { useState, useEffect } from 'react';
import { Fingerprint, X, ShieldCheck, Cpu, Target, Zap, CircleDashed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanType, setScanType] = useState<'fingerprint' | 'tongue'>('fingerprint');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'scanning') {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('success');
            setTimeout(onSuccess, 1000);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [status, onSuccess]);

  const startScan = (type: 'fingerprint' | 'tongue') => {
    setScanType(type);
    setStatus('scanning');
    setScanProgress(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl p-8 overflow-hidden"
          >
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-8 p-4 bg-zinc-800 rounded-3xl border border-white/5">
                <ShieldCheck className="w-8 h-8 text-orange-500" />
              </div>
              
              <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">Neural Biometric Sync</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] mb-12">Level 4 Verification Required</p>

              <div className="w-full space-y-4 mb-12">
                {status === 'idle' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => startScan('fingerprint')}
                      className="p-6 bg-zinc-800/50 border border-white/5 rounded-3xl hover:border-orange-500/50 transition-all group"
                    >
                      <Fingerprint className="w-8 h-8 text-zinc-500 group-hover:text-orange-500 mb-4 mx-auto transition-colors" />
                      <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-400">Fingerprint</span>
                    </button>
                    <button 
                      onClick={() => startScan('tongue')}
                      className="p-6 bg-zinc-800/50 border border-white/5 rounded-3xl hover:border-blue-500/50 transition-all group"
                    >
                      <Target className="w-8 h-8 text-zinc-500 group-hover:text-blue-500 mb-4 mx-auto transition-colors" />
                      <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-400">Tongue Print</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-8">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="60"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray="377"
                          initial={{ strokeDashoffset: 377 }}
                          animate={{ strokeDashoffset: 377 - (377 * scanProgress) / 100 }}
                          className={scanType === 'fingerprint' ? 'text-orange-500' : 'text-blue-500'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          {scanType === 'fingerprint' ? (
                            <Fingerprint className="w-12 h-12 text-orange-500" />
                          ) : (
                            <Target className="w-12 h-12 text-blue-500" />
                          )}
                        </motion.div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">
                        {status === 'scanning' ? `${scanType.toUpperCase()} SCANNING...` : 'ACCESS GRANTED'}
                      </p>
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
                        {status === 'scanning' ? `PROGRESS: ${Math.round(scanProgress)}%` : 'NEURAL HANDSHAKE COMPLETE'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-2">
                  <Zap className="w-3 h-3 text-orange-500" />
                  <span className="text-[7px] font-mono text-zinc-600 uppercase">AES-256</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-2">
                  <Cpu className="w-3 h-3 text-blue-500" />
                  <span className="text-[7px] font-mono text-zinc-600 uppercase">SECURE CO</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[7px] font-mono text-zinc-600 uppercase">VERIFIED</span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="mt-8 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
              >
                Cancel Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
