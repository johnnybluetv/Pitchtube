import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  orbitRadius: number;
  type: 'star' | 'planet' | 'nebula';
  opacity: number;
}

export const LivingGalaxy: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 400;

    const colors = [
      '#ffffff', // Star
      '#f97316', // Orange planet
      '#3b82f6', // Blue planet
      '#8b5cf6', // Purple nebula
      '#ec4899', // Pink star
      '#facc15', // Yellow sun
    ];

    const init = () => {
      for (let i = 0; i < particleCount; i++) {
        const type = i % 25 === 0 ? 'planet' : i % 60 === 0 ? 'nebula' : 'star';
        
        // Distribute some stars in "clusters" (solar systems)
        const isClustered = i % 10 === 0;
        const clusterBiasX = isClustered ? Math.random() * width : width / 2;
        const clusterBiasY = isClustered ? Math.random() * height : height / 2;
        
        const orbitRadius = Math.random() * (Math.max(width, height) * 0.9);
        const angle = Math.random() * Math.PI * 2;
        const speedMultiplier = type === 'star' ? 1 : type === 'planet' ? 0.4 : 0.2;
        
        particles.push({
          x: clusterBiasX + (Math.random() - 0.5) * 200,
          y: clusterBiasY + (Math.random() - 0.5) * 200,
          z: Math.random() * 2,
          size: type === 'star' ? Math.random() * 1.8 : type === 'planet' ? Math.random() * 5 + 3 : Math.random() * 30 + 15,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: ((Math.random() * 0.0008) + 0.0002) * speedMultiplier,
          angle: angle,
          orbitRadius: orbitRadius,
          type: type,
          opacity: Math.random()
        });
      }
    };

    const drawParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw connections for "solar systems"
      particles.forEach((p, index) => {
        if (p.type === 'planet' && index % 10 === 0) {
          ctx.beginPath();
          ctx.strokeStyle = p.color + '11';
          ctx.lineWidth = 0.5;
          ctx.ellipse(centerX, centerY, p.orbitRadius, p.orbitRadius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      particles.forEach(p => {
        p.angle += p.speed;
        
        const x = centerX + Math.cos(p.angle) * p.orbitRadius;
        const y = centerY + Math.sin(p.angle) * p.orbitRadius * 0.4;

        ctx.beginPath();
        if (p.type === 'nebula') {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size);
          gradient.addColorStop(0, p.color + '22');
          gradient.addColorStop(0.5, p.color + '11');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          
          if (p.type === 'planet') {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            // Draw a tiny ring for some planets
            if (p.size > 5) {
              ctx.strokeStyle = p.color + '44';
              ctx.lineWidth = 1;
              ctx.ellipse(x, y, p.size * 2, p.size * 0.5, p.angle, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (p.type === 'star') {
          p.opacity += (Math.random() - 0.5) * 0.08;
          if (p.opacity > 1) p.opacity = 1;
          if (p.opacity < 0.2) p.opacity = 0.2;
        }
      });

      requestAnimationFrame(drawParticles);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    init();
    drawParticles();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
};
