import React from 'react';
import { X, Copy, Check, Twitter, Linkedin, Facebook, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ShareModal({ isOpen, onClose, companyName, shareUrl }: { isOpen: boolean, onClose: () => void, companyName: string, shareUrl: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (name: string) => {
    const text = `Check out this pitch from ${companyName} on PitchTube!`;
    let url = '';

    switch (name) {
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'LinkedIn':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'Direct':
        handleCopy();
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const socials = [
    { name: 'Twitter', icon: Twitter, color: 'hover:text-sky-400' },
    { name: 'LinkedIn', icon: Linkedin, color: 'hover:text-blue-600' },
    { name: 'Facebook', icon: Facebook, color: 'hover:text-blue-500' },
    { name: 'Direct', icon: Send, color: 'hover:text-emerald-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] max-w-md w-full p-8 relative shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 mx-auto rotate-3">
                <Send className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Share Pitch</h3>
              <p className="text-zinc-500 text-sm font-mono mt-1 uppercase tracking-widest">{companyName} // Global Stream</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {socials.map((social) => (
                  <button
                    key={social.name}
                    onClick={() => handleSocialShare(social.name)}
                    className={`flex flex-col items-center gap-2 group transition-all`}
                  >
                    <div className={`w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center transition-all group-hover:border-orange-500/50 group-hover:bg-zinc-900 ${social.color}`}>
                      <social.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{social.name}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Link</div>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-16 pr-12 py-4 text-xs font-mono text-zinc-400 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800">
               <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em] text-center italic">
                 Note: Shared links include temporary access keys for deck viewing.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
