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
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create multiple layers of gradients
      const drawLayer = (color: string, offsetX: number, offsetY: number, scale: number) => {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2 + Math.sin(time + offsetX) * 300,
          canvas.height / 2 + Math.cos(time + offsetY) * 200,
          0,
          canvas.width / 2 + Math.sin(time + offsetX) * 300,
          canvas.height / 2 + Math.cos(time + offsetY) * 200,
          canvas.width * scale
        );

        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      // Crimson (#EB2E4E)
      drawLayer('rgba(235, 46, 78, 0.15)', 0, 0, 0.8);
      // Orchid (#D629AD)
      drawLayer('rgba(214, 41, 173, 0.1)', 2, 3, 1.2);
      // Dark Accents
      drawLayer('rgba(20, 16, 17, 0.4)', 1, 1, 0.5);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full aurora-canvas bg-[#141011]"
      style={{ zIndex: -1 }}
    />
  );
};
