import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Heart, Star, Zap, Coffee, Gift, ChevronRight, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

interface GiftOverlayProps {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
}

const GIFT_TIERS = [
  { id: 'coffee', name: 'Hot Brew', price: 10, icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'clap', name: 'High Volt', price: 50, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'heart', name: 'Neural Love', price: 100, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'star', name: 'Superstar', price: 500, icon: Star, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'rocket', name: 'Moon Soon', price: 1000, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export function GiftOverlay({ targetUserId, targetName, onClose }: GiftOverlayProps) {
  const { wallet, sendGift, purchaseCoins } = useWallet();
  const [selectedGift, setSelectedGift] = useState(GIFT_TIERS[0]);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!wallet || wallet.balance < selectedGift.price) {
      setError("Insufficient neural credits. Top up required.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await sendGift(targetUserId, selectedGift.price);
      setShowSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err.message || "Transmission interrupted.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
    >
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
           <Gift className="w-5 h-5 text-orange-500" />
           <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Send Gift</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {!showSuccess ? (
        <>
          <div className="mb-6 text-center">
            <p className="text-zinc-400 text-sm font-medium">Supporting <span className="text-white font-bold">{targetName}</span>'s vision</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {GIFT_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedGift(tier)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 relative group ${
                  selectedGift.id === tier.id 
                    ? 'border-orange-500 bg-orange-500/5' 
                    : 'border-white/5 bg-white/5 hover:border-white/10'
                }`}
              >
                <tier.icon className={`w-6 h-6 ${tier.color} group-hover:scale-110 transition-transform`} />
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-200">{tier.name}</div>
                  <div className="text-xs font-mono font-bold text-orange-500">{tier.price} <span className="text-[8px]">CR</span></div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Balance</span>
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-sm font-black font-mono text-white">{wallet?.balance || 0}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={isSending}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                isSending ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-600 text-white hover:bg-orange-500 shadow-xl'
              }`}
            >
              {isSending ? 'Transmitting...' : `Confirm Gift (${selectedGift.price} CR)`}
              {!isSending && <ChevronRight className="w-4 h-4" />}
            </button>

            {wallet && wallet.balance < selectedGift.price && (
               <button 
                onClick={() => purchaseCoins(1000)}
                className="w-full text-center text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
               >
                 Top up 1,000 Neural Credits (DEMO)
               </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
           <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
           </div>
           <h4 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">Gift Sent!</h4>
           <p className="text-zinc-400 text-sm font-medium">Neural credits have been distributed to the founder's node.</p>
        </div>
      )}
    </motion.div>
  );
}
