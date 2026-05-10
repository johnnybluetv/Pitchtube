import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Star {
  id: string;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  type: 'shooting' | 'falling';
}

export const StarEffect: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  const addStars = useCallback((count: number = 5, type: 'shooting' | 'falling' = 'shooting') => {
    const newStars: Star[] = Array.from({ length: count }).map(() => {
      const isShooting = type === 'shooting';
      return {
        id: Math.random().toString(36).substring(2, 9),
        x: isShooting ? -50 : Math.random() * window.innerWidth,
        y: isShooting ? Math.random() * (window.innerHeight * 0.7) : -50,
        angle: isShooting ? (Math.random() * 20) + 10 : (Math.random() * 30) - 15,
        velocity: (Math.random() * 15) + (isShooting ? 20 : 10),
        size: (Math.random() * 2) + 1,
        color: Math.random() > 0.5 ? '#f97316' : '#3b82f6',
        type
      };
    });
    setStars(prev => [...prev, ...newStars]);
    
    // Cleanup
    setTimeout(() => {
      setStars(prev => prev.filter(s => !newStars.find(ns => ns.id === s.id)));
    }, 2500);
  }, []);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { type, count } = e.detail || {};
      if (type === 'shooting-star') {
        addStars(count || 8, 'shooting');
      } else if (type === 'falling-star') {
        addStars(count || 12, 'falling');
      }
    };

    window.addEventListener('trigger-visual-effect', handleTrigger);
    return () => window.removeEventListener('trigger-visual-effect', handleTrigger);
  }, [addStars]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ 
              x: star.type === 'shooting' ? -100 : star.x, 
              y: star.type === 'shooting' ? star.y : -100, 
              opacity: 0 
            }}
            animate={{ 
              x: star.type === 'shooting' 
                ? window.innerWidth + 100 
                : star.x + (window.innerHeight) * Math.tan(star.angle * Math.PI / 180),
              y: star.type === 'shooting'
                ? star.y + (window.innerWidth / 2) * Math.tan(star.angle * Math.PI / 180)
                : window.innerHeight + 100,
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: star.type === 'shooting' ? 1.5 : 2.5, 
              ease: "linear" 
            }}
            className="absolute rounded-full"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 5}px ${star.color}, 0 0 ${star.size * 10}px ${star.color}`,
            }}
          >
            {/* Trail */}
            <div 
              className="absolute rounded-full"
              style={{
                width: star.type === 'shooting' ? '100px' : '2px',
                height: star.type === 'shooting' ? '2px' : '100px',
                right: star.type === 'shooting' ? 0 : 'unset',
                top: star.type === 'shooting' ? '50%' : 'unset',
                bottom: star.type === 'shooting' ? 'unset' : 0,
                left: star.type === 'shooting' ? 'unset' : '50%',
                translate: star.type === 'shooting' ? '0 -50%' : '-50% 0',
                background: `linear-gradient(${star.type === 'shooting' ? 'to right' : 'to bottom'}, transparent, ${star.color})`,
                transform: `rotate(${star.type === 'shooting' ? -star.angle : 0}deg)`,
                transformOrigin: star.type === 'shooting' ? 'right center' : 'center bottom'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const triggerEffect = (type: string, count: number = 8) => {
  window.dispatchEvent(new CustomEvent('trigger-visual-effect', { 
    detail: { type, count } 
  }));
};
