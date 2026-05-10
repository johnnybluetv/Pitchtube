import React, { createContext, useContext, useState } from 'react';
import { Monitor, Smartphone, Tablet, Tv, Laptop, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ViewportMode = 'phone' | 'tablet' | 'desktop' | 'tv' | 'laptop';

interface ViewportContextType {
  mode: ViewportMode;
  setMode: (mode: ViewportMode) => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ViewportMode>('desktop');

  return (
    <ViewportContext.Provider value={{ mode, setMode }}>
      <div className={`transition-all duration-700 ease-[0.22, 1, 0.36, 1] mx-auto min-h-screen overflow-x-hidden ${
        mode === 'phone' ? 'max-w-[390px] border-x-[12px] border-zinc-900 rounded-[3rem] my-8 shadow-2xl h-[844px] overflow-y-auto custom-scrollbar ring-8 ring-zinc-800' :
        mode === 'tablet' ? 'max-w-[820px] border-[16px] border-zinc-900 rounded-[4rem] my-8 shadow-2xl h-[1180px] overflow-y-auto custom-scrollbar ring-8 ring-zinc-800' :
        mode === 'laptop' ? 'max-w-[1280px] border-t-[20px] border-x-[20px] border-b-[40px] border-zinc-900 rounded-t-3xl shadow-2xl my-8 h-[800px] overflow-y-auto custom-scrollbar' :
        mode === 'tv' ? 'max-w-[1920px] w-full border-[10px] border-zinc-950 shadow-2xl' :
        'w-full'
      }`}>
        {children}
      </div>
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) throw new Error('useViewport must be used within ViewportProvider');
  return context;
}

export function ViewportDropdown() {
  const { mode, setMode } = useViewport();
  const [isOpen, setIsOpen] = useState(false);

  const modes = [
    { id: 'phone', label: 'Phone Mode', icon: Smartphone },
    { id: 'tablet', label: 'Tablet Mode', icon: Tablet },
    { id: 'laptop', label: 'Laptop Mode', icon: Laptop },
    { id: 'desktop', label: 'Desktop Mode', icon: Monitor },
    { id: 'tv', label: 'TV Mode', icon: Tv },
  ];

  const currentMode = modes.find(m => m.id === mode);
  const CurrentIcon = currentMode?.icon || Monitor;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
      >
        <CurrentIcon className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white hidden sm:block">
          {currentMode?.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id as ViewportMode);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      mode === m.id ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <m.icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </div>
                    {mode === m.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
