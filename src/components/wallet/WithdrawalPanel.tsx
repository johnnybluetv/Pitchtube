import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, IndianRupee, Bitcoin, CreditCard, ChevronRight, CheckCircle2, History, ArrowDownToLine, ReceiptText } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

export function WithdrawalPanel() {
  const { wallet, withdraw } = useWallet();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bitcoin' | 'paypal' | 'bank'>('bitcoin');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!wallet || isNaN(numAmount) || numAmount < 10) return;

    setIsProcessing(true);
    try {
      await withdraw(numAmount, method, { address });
      setSuccess(true);
      setAmount('');
      setAddress('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Financial Node // Withdrawal</h3>
           <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">Off-ramp management // Series A earnings</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
           <Coins className="w-3.5 h-3.5 text-emerald-500" />
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{wallet?.balance || 0} Neural Credits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex gap-2">
            {[
              { id: 'bitcoin', icon: Bitcoin, color: 'text-orange-500', label: 'Bitcoin' },
              { id: 'paypal', icon: CreditCard, color: 'text-blue-500', label: 'PayPal' },
              { id: 'bank', icon: IndianRupee, color: 'text-emerald-500', label: 'Bank' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  method === m.id ? 'bg-white/5 border-white/20 active' : 'border-white/5 opacity-50 grayscale hover:grayscale-0'
                }`}
              >
                <m.icon className={`w-6 h-6 ${m.color}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Amount to Off-ramp</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min 10 Neural Credits"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-zinc-200 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">
                {method === 'bitcoin' ? 'BTC Wallet Address' : method === 'paypal' ? 'PayPal Email' : 'IBAN / Swift Code'}
              </label>
              <input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={method === 'bitcoin' ? 'bc1q...' : 'investor@example.com'}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-zinc-200 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={isProcessing || !amount || parseFloat(amount) > (wallet?.balance || 0)}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                isProcessing ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {isProcessing ? 'Verifying Neural Match...' : 'Initiate Withdrawal'}
              <ArrowDownToLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-800 rounded-3xl p-6 relative">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <History className="w-3 h-3" />
              Recent Ledger Entries
            </h4>
            <div className="text-[9px] font-mono text-emerald-500 uppercase">Live_Updates</div>
          </div>

          <div className="space-y-4">
             <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase">Transmission Pending</div>
                    <div className="text-[9px] text-zinc-400">Node verification takes 1-3 business cycles.</div>
                  </div>
                </motion.div>
              )}
             </AnimatePresence>

             {[
               { id: 1, type: 'TIP', user: 'Global Ventures', amount: '+500', time: '2m ago' },
               { id: 2, type: 'TIP', user: 'Angel AI', amount: '+1,200', time: '1h ago' },
               { id: 3, type: 'WITHDRAW', user: 'BTC Off-ramp', amount: '-4,000', time: '1d ago' },
             ].map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'TIP' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                       <ReceiptText className={`w-4 h-4 ${tx.type === 'TIP' ? 'text-emerald-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-white uppercase tracking-tighter">{tx.user}</div>
                       <div className="text-[8px] font-mono text-zinc-500 uppercase">{tx.time}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-black font-mono ${tx.type === 'TIP' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {tx.amount}
                  </div>
                </div>
             ))}
          </div>

          <div className="absolute bottom-4 left-0 right-0 px-6">
             <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Earned</span>
                   <span className="text-xs font-black font-mono text-emerald-500">+{wallet?.totalEarned || 0}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500/40 w-2/3" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
