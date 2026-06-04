"use client"

import React from 'react';
import { Music, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  trackTitle: string;
  artist: string;
  description: string;
  isVisible: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
  trackTitle, 
  artist, 
  description,
  isVisible 
}) => {
  return (
    <div className={cn(
      "fixed bottom-8 right-8 w-96 miniplayer-glass rounded-xl p-5 shadow-2xl transition-all duration-700 transform",
      isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95 pointer-events-none"
    )}>
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-lg border border-primary/30">
          <Music className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 font-headline">Now Playing</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-white truncate leading-tight">
            {trackTitle}
          </h2>
          <p className="text-accent text-sm font-medium mb-3">
            {artist}
          </p>
          <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent mb-3" />
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 italic font-body">
            "{description}"
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end h-3">
            <div className="w-1 bg-primary/60 rounded-full animate-[bounce_1s_infinite]" />
            <div className="w-1 bg-primary rounded-full animate-[bounce_1.2s_infinite]" />
            <div className="w-1 bg-primary/40 rounded-full animate-[bounce_0.8s_infinite]" />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">LIVE FEED ACTIVE</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <Radio className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-primary font-headline">AURASTREAM HD</span>
        </div>
      </div>
    </div>
  );
};
