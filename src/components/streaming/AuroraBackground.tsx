"use client"

import React from 'react';

export const AuroraBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden" 
      style={{ zIndex: 0 }} 
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-60">
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
      
      {/* Soft noise overlay for texture */}
      <div 
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
    </div>
  );
};
