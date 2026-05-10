import React, { useState, useEffect, useMemo } from 'react';
import { PitchCard, Pitch } from './PitchCard';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function PitchFeed() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const industries = useMemo(() => {
    const set = new Set<string>();
    pitches.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [pitches]);

  useEffect(() => {
    const q = query(collection(db, 'pitches'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPitches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pitch[];
      setPitches(fetchedPitches);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pitches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPitches = useMemo(() => {
    return pitches.filter(pitch => {
      const company = pitch.company_name || '';
      const founder = pitch.founder_name || '';
      const matchesSearch = 
        company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        founder.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTier = tierFilter === 'all' || pitch.tier === tierFilter;
      const matchesIndustry = industryFilter === 'all' || pitch.category === industryFilter;
      
      return matchesSearch && matchesTier && matchesIndustry;
    });
  }, [pitches, searchQuery, tierFilter, industryFilter]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Search and Filter Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search startup or founder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-full text-zinc-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
            {['all', '30s', '1m', '3m'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  tierFilter === tier 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : `${tier} Pitch`}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustryFilter(ind)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  industryFilter === ind 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {ind === 'all' ? 'All Industries' : ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Scanning Network...</span>
          </div>
        ) : filteredPitches.length > 0 ? (
          filteredPitches.map((pitch) => (
            <PitchCard key={pitch.id} pitch={pitch} />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
              <Search className="w-6 h-6 text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-2">No Pitches Found</h3>
            <p className="text-zinc-600 text-[10px] font-mono leading-tight max-w-[200px]">
              Try adjusting your filters or searching for something else.
            </p>
          </div>
        )}
        <div className="h-40 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest border-t border-zinc-900/50 mt-10">
          End of Stream // v1.0
        </div>
      </div>
    </div>
  );
}
