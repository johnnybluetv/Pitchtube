import React, { useState, useEffect, useMemo } from 'react';
import { IntrestorCard, Intrestor } from './IntrestorCard';
import { Search, X, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function IntrestorFeed() {
  const [intrestors, setIntrestors] = useState<Intrestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'intrestors'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Intrestor[];
      setIntrestors(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching intrestors:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allIndustries = useMemo(() => {
    const industries = new Set<string>();
    intrestors.forEach(i => (i.focus_industries || []).forEach(tag => industries.add(tag)));
    return ['all', ...Array.from(industries)];
  }, [intrestors]);

  const filteredIntrestors = useMemo(() => {
    return intrestors.filter(intrestor => {
      const investorName = intrestor.investor_name || '';
      const firmName = intrestor.firm_name || '';
      const matchesSearch = 
        investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firmName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesIndustry = industryFilter === 'all' || (intrestor.focus_industries || []).includes(industryFilter);
      
      return matchesSearch && matchesIndustry;
    });
  }, [intrestors, searchQuery, industryFilter]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search firm or investor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors text-white"
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
            {allIndustries.map((industry) => (
              <button
                key={industry}
                onClick={() => setIndustryFilter(industry)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  industryFilter === industry 
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {industry === 'all' ? 'All Sectors' : industry}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Accessing Ledger...</span>
          </div>
        ) : filteredIntrestors.length > 0 ? (
          filteredIntrestors.map((t) => (
            <IntrestorCard key={t.id} intrestor={t} />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
              <Search className="w-6 h-6 text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-sm mb-2">No Intrestors Found</h3>
            <p className="text-zinc-600 text-[10px] font-mono leading-tight max-w-[200px]">
              Adjust filters to find matching investment theses.
            </p>
          </div>
        )}
        <div className="h-40 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest border-t border-zinc-900/50 mt-10">
          Capture End // Signal Clean
        </div>
      </div>
    </div>
  );
}
