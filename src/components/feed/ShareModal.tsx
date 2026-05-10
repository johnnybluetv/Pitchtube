import React from 'react';
import { X, Copy, Twitter, Linkedin, Facebook, Link as LinkIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
  url: string;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, url, title }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (onShare) onShare();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = [
    { name: 'Twitter', icon: Twitter, color: 'hover:text-sky-400', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { name: 'LinkedIn', icon: Linkedin, color: 'hover:text-blue-600', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: 'Facebook', icon: Facebook, color: 'hover:text-blue-500', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-2xl">
                  <LinkIcon className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">Share Pitch</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none translate-y-0.5">Broadcast the Vision</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-center gap-6">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onShare?.()}
                    className={`p-5 bg-zinc-900 border border-white/5 rounded-3xl transition-all duration-300 group ${link.color}`}
                  >
                    <link.icon className="w-8 h-8 text-zinc-400 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Or Copy Link</p>
                <div className="relative group">
                  <input
                    readOnly
                    type="text"
                    value={url}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 pr-16 text-zinc-300 text-sm font-mono overflow-hidden whitespace-nowrap text-ellipsis"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
