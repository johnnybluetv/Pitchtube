import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Briefcase, Rocket, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
  id: string;
  type: 'founder' | 'investor' | 'startup';
  title: string;
  subtitle: string;
}

const mockResults: SearchResult[] = [
  { id: '1', type: 'startup', title: 'Nexus AI', subtitle: 'Generative Infrastructure' },
  { id: '2', type: 'founder', title: 'Sarah Chen', subtitle: 'SolarGrid AI' },
  { id: '3', type: 'investor', title: 'Andreessen Horowitz', subtitle: 'Venture Capital' },
  { id: '4', type: 'startup', title: 'SolarGrid', subtitle: 'Decentralized Energy' },
  { id: '5', type: 'investor', title: 'Sequoia Capital', subtitle: 'Venture Capital' },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockResults.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) || 
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all group w-64"
      >
        <Search className="w-4 h-4 group-hover:text-orange-500" />
        <span className="text-xs font-medium flex-1 text-left">Search Ecosystem...</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-[10px] font-mono">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Search Bar */}
              <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
                <Search className="w-5 h-5 text-zinc-500" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search founders, companies, investors..."
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-600 text-lg"
                />
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 max-h-[60vh] overflow-y-auto no-scrollbar p-2">
                {query.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Type to search the pitchtube ecosystem</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((result) => (
                      <button 
                        key={result.id}
                        className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition-all group border border-transparent hover:border-zinc-800 text-left"
                      >
                        <div className={`p-2 rounded-lg ${
                          result.type === 'founder' ? 'bg-orange-500/10 text-orange-500' :
                          result.type === 'investor' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {result.type === 'founder' ? <User className="w-5 h-5" /> :
                           result.type === 'investor' ? <Briefcase className="w-5 h-5" /> :
                           <Rocket className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{result.title}</h4>
                          <p className="text-xs text-zinc-500 font-mono lower">{result.subtitle}</p>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded">
                          {result.type}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">No matches found for "{query}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 flex justify-between items-center px-6">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                    <div className="px-1 py-0.5 border border-zinc-800 rounded bg-zinc-900">↑↓</div>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
                    <div className="px-1 py-0.5 border border-zinc-800 rounded bg-zinc-900">Enter</div>
                    <span>Select</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-700 font-mono uppercase italic tracking-widest">PitchTube_Global_Index_v4.2</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
