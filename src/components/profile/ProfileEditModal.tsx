import React, { useState } from 'react';
import { X, Save, Camera, Globe, Linkedin, Twitter, Github, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, profile, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    linkedin_url: profile?.linkedin_url || '',
    twitter_url: profile?.twitter_url || '',
    github_url: profile?.github_url || '',
    website_url: profile?.website_url || '',
    photoURL: profile?.photoURL || '',
    cover_url: profile?.cover_url || '',
    fundingHistory: profile?.fundingHistory || [],
    transactionHistory: profile?.transactionHistory || []
  });

  const addFundingRound = () => {
    setFormData({
      ...formData,
      fundingHistory: [...formData.fundingHistory, { round: '', amount: '', date: '' }]
    });
  };

  const updateFundingRound = (index: number, field: string, value: string) => {
    const newHistory = [...formData.fundingHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setFormData({ ...formData, fundingHistory: newHistory });
  };

  const addTransaction = () => {
    setFormData({
      ...formData,
      transactionHistory: [...formData.transactionHistory, { id: `manual_${Date.now()}`, type: 'deposit', amount: 0, status: 'completed', date: new Date().toISOString().split('T')[0] }]
    });
  };

  const updateTransactionStatus = (index: number, field: string, value: any) => {
    const newHistory = [...formData.transactionHistory];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setFormData({ ...formData, transactionHistory: newHistory });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'users', profile.id);
      await updateDoc(docRef, formData);
      onUpdate({ ...profile, ...formData });
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
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
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-2xl">
                  <Camera className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">Edit Profile</h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none translate-y-0.5">Neural Identity Sync</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Display Name</label>
                    <input
                      required
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Headline</label>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="e.g. Founder @ TechFlow"
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell your story..."
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Visual Identity</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Avatar URL</label>
                    <input
                      type="url"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Cover URL</label>
                    <input
                      type="url"
                      value={formData.cover_url}
                      onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="LinkedIn URL"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-zinc-300 text-xs focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="Twitter URL"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-zinc-300 text-xs focus:outline-none focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="GitHub URL"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-zinc-300 text-xs focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="url"
                      placeholder="Website URL"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 pl-12 text-zinc-300 text-xs focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Funding History (Founder Only) */}
              {profile?.role === 'founder' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Capital Trajectory</h4>
                    <button 
                      type="button"
                      onClick={addFundingRound}
                      className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-400"
                    >
                      + Add Round
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.fundingHistory.map((round: any, i: number) => (
                      <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 rounded-2xl border border-white/5">
                        <input
                          placeholder="Round (e.g. Seed)"
                          value={round.round}
                          onChange={(e) => updateFundingRound(i, 'round', e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-white focus:outline-none"
                        />
                        <input
                          placeholder="Amount"
                          value={round.amount}
                          onChange={(e) => updateFundingRound(i, 'amount', e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-orange-500 focus:outline-none"
                        />
                        <input
                          placeholder="Date"
                          value={round.date}
                          onChange={(e) => updateFundingRound(i, 'date', e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-zinc-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction History (General) */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Ledger Entries</h4>
                  <button 
                    type="button"
                    onClick={addTransaction}
                    className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400"
                  >
                    + Log Transaction
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.transactionHistory.map((tx: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-zinc-900 rounded-2xl border border-white/5">
                      <select
                        value={tx.type}
                        onChange={(e) => updateTransactionStatus(i, 'type', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-white focus:outline-none appearance-none"
                      >
                        <option value="deposit">Deposit</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="investment">Investment</option>
                        <option value="reward">Reward</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={tx.amount}
                        onChange={(e) => updateTransactionStatus(i, 'amount', parseFloat(e.target.value))}
                        className="bg-transparent text-[10px] font-bold text-emerald-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={tx.date}
                        onChange={(e) => updateTransactionStatus(i, 'date', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-zinc-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Global Identity</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
