"use client"

import React, { useRef, useEffect, useState } from 'react';

const DEFAULT_VIDEO = '/video-background.mp4';

interface AuroraBackgroundProps {
  /** URL do vídeo S3 da música atual. Se não informado, usa o vídeo padrão. */
  videoUrl?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string>(DEFAULT_VIDEO);
  const [fadingIn, setFadingIn] = useState(true);

  // Quando o videoUrl muda, faz crossfade para o novo vídeo
  useEffect(() => {
    const target = videoUrl || DEFAULT_VIDEO;
    if (target === activeSrc) return;

    // Fade out → troca src → fade in
    setFadingIn(false);
    const t = setTimeout(() => {
      setActiveSrc(target);
      setFadingIn(true);
    }, 400);

    return () => clearTimeout(t);
  }, [videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recarrega o vídeo quando o src muda, garantindo liberação correta do
  // decodificador anterior para evitar acúmulo de memória em lives longas.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Libera o decodificador de vídeo atual ANTES de atribuir o novo src.
    // Sem isso, o browser mantém o decodificador e seus buffers alocados,
    // acumulando centenas de MB em várias horas de transmissão.
    video.pause();
    video.removeAttribute('src');
    video.load();

    video.src = activeSrc;
    video.load();
    video.play().catch(() => {});

    // Cleanup: libera ao desmontar o componente
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [activeSrc]);

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden" 
      style={{ zIndex: 0 }} 
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          transition: 'opacity 400ms ease-in-out',
          opacity: fadingIn ? 1 : 0,
        }}
      />
      <div className="absolute top-0 left-0 w-full h-full opacity-60 z-10">
        {/* Cyan Blob */}
        <div 
          className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full mix-blend-screen opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, transparent 60%)',
            animation: 'pulse 10s infinite alternate'
          }}
        />
        {/* Purple Blob */}
        <div 
          className="absolute top-[40%] left-[40%] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 60%)',
            animation: 'pulse 15s infinite alternate-reverse'
          }}
        />
        {/* Deep Blue Blob */}
        <div 
          className="absolute top-[10%] left-[50%] w-[45vw] h-[45vw] rounded-full mix-blend-screen opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)',
            animation: 'pulse 12s infinite alternate'
          }}
        />
      </div>
    </div>
  );
};
