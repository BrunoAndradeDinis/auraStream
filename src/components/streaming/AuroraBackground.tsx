"use client"

import React, { useEffect, useRef } from 'react';

export const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrame = 0;
    const FPS = 15; // Reduzido de 30 para 15 para salvar CPU na VM
    const INTERVAL = 1000 / FPS;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const drawAurora = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Onda Cyan (#00F0FF)
      const gradCyan = ctx.createRadialGradient(
        canvas.width * (0.3 + 0.1 * Math.sin(t * 0.0005)),
        canvas.height * 0.4,
        0,
        canvas.width * 0.5, canvas.height * 0.5,
        canvas.width * 0.6
      );
      gradCyan.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      gradCyan.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradCyan;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Onda Roxo (#7C3AED)
      const gradPurple = ctx.createRadialGradient(
        canvas.width * (0.7 + 0.05 * Math.cos(t * 0.0007)),
        canvas.height * 0.6,
        0,
        canvas.width * 0.5, canvas.height * 0.5,
        canvas.width * 0.5
      );
      gradPurple.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
      gradPurple.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradPurple;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = (timestamp: number) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      if (timestamp - lastFrame < INTERVAL) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      lastFrame = timestamp;
      drawAurora(timestamp);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-black to-slate-950" 
        style={{ zIndex: 0 }} 
      />
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full aurora-canvas pointer-events-none mix-blend-screen"
        style={{ zIndex: 1, opacity: 0.5 }}
      />
    </>
  );
};
