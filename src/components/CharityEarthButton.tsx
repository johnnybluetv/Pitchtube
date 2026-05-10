import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export function CharityEarthButton() {
  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-center gap-3">
      <motion.a
        href="https://selar.co/showlove/homeaway"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center group pointer-events-auto"
        whileHover={{ scale: 1.1 }}
      >
        {/* Anti-clockwise spinning earth */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:text-blue-400 transition-colors"
        >
          <Globe className="w-14 h-14 lg:w-16 lg:h-16" strokeWidth={1.5} />
        </motion.div>
        
        {/* Overlay text on earth */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-black text-white uppercase text-center leading-none tracking-tighter drop-shadow-lg px-2 group-hover:scale-105 transition-transform bg-black/20 rounded-full py-1">
            click to<br/>donate
          </span>
        </div>
      </motion.a>
      
      {/* Inscription below */}
      <div className="max-w-[140px] text-center">
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed drop-shadow-sm">
          DONATE TO PILLOW CHARITY FOUNDATION 
          <br/>
          <span className="text-zinc-600 font-mono text-[7px]">(OUR NGO)</span>
        </p>
      </div>
    </div>
  );
}
