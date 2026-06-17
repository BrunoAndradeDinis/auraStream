"use client"

import React, { useState, useEffect } from 'react';

export const AuroraBackground: React.FC = () => {
  const [isStreamClient, setIsStreamClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStreamClient(new URLSearchParams(window.location.search).get('stream_client') === 'true');
    }
  }, []);

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden" 
      style={{ zIndex: 0 }} 
    >
      <video
        src="/video-background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
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
