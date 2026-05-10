import React, { useState } from 'react';
import { Coins, Plus, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import { motion, AnimatePresence } from 'motion/react';

export function WalletHeader() {
  const { wallet, purchaseCoins } = useWallet();
  const [isBuying, setIsBuying] = useState(false);

  const handleBuy = async (amount: number) => {
    setIsBuying(true);
    await purchaseCoins(amount);
    setIsBuying(false);
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20">
            <Zap className="w-5 h-5 text-orange-500" />
         </div>
         <div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Neural Credits</div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black font-mono text-white tabular-nums">{wallet?.balance || 0}</span>
               <div className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black text-orange-500 uppercase">Synced</div>
            </div>
         </div>
      </div>

      <div className="flex items-center gap-3">
         <div className="hidden lg:flex items-center gap-6 px-6 border-x border-white/5">
            <div className="text-center">
               <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Efficiency</div>
               <div className="text-xs font-bold text-emerald-500">99.8%</div>
            </div>
            <div className="text-center">
               <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Uptime</div>
               <div className="text-xs font-bold text-blue-500">2.4ms</div>
            </div>
         </div>

         <div className="relative group">
            <button 
              className="px-4 py-2 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5 group"
            >
               <Plus className="w-3.5 h-3.5" />
               Recharge Credits
            </button>
            
            <div className="absolute top-full right-0 mt-3 w-64 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-50 origin-top-right backdrop-blur-xl">
               <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 rounded-lg border border-white/5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Select Relay Package</span>
               </div>
               
               <div className="space-y-2">
                  {[
                    { amt: 500, price: '$5', icon: Zap },
                    { amt: 2500, price: '$20', icon: ShieldCheck, popular: true },
                    { amt: 10000, price: '$75', icon: Sparkles }
                  ].map((p) => (
                    <button 
                      key={p.amt}
                      onClick={() => handleBuy(p.amt)}
                      disabled={isBuying}
                      className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-left relative overflow-hidden"
                    >
                       <div className="flex items-center gap-3">
                          <p.icon className="w-4 h-4 text-orange-500" />
                          <div>
                             <div className="text-[10px] font-black text-white uppercase">{p.amt} Credits</div>
                             <div className="text-[9px] font-mono text-zinc-500">{p.price} One-time</div>
                          </div>
                       </div>
                       {p.popular && (
                         <div className="absolute top-0 right-0 px-2 py-0.5 bg-orange-500 text-black text-[7px] font-black uppercase rounded-bl-lg">Best Value</div>
                       )}
                    </button>
                  ))}
               </div>
               
               <div className="mt-4 flex items-center justify-center gap-2 text-zinc-600">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Encrypted Node</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
