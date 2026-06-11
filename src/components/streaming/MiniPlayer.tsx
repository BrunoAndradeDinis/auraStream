'use client';
import { useState, useEffect } from 'react';
import { TrackInfo } from '@/types/shared';

interface MiniPlayerProps {
  currentTrack: TrackInfo | null;
}

export function MiniPlayer({ currentTrack }: MiniPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayTrack, setDisplayTrack] = useState<TrackInfo | null>(currentTrack);

  useEffect(() => {
    if (!currentTrack) {
      setIsVisible(false);
      setTimeout(() => setDisplayTrack(null), 200);
      return;
    }
    
    // Fade out
    setIsVisible(false);
    const timer = setTimeout(() => {
      setDisplayTrack(currentTrack);
      setIsVisible(true); // Fade in
    }, 200);
    
    return () => clearTimeout(timer);
  }, [currentTrack]); // O currentTrack.id seria melhor se houvesse a garantia de id. Mas currentTrack também serve pois no page ele é atualizado quando muda.

  if (!displayTrack) return null;

  return (
    <div className={`miniplayer-glow ${isVisible ? 'miniplayer-enter' : 'opacity-0 scale-95 pointer-events-none'}`} style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '280px',
      height: '140px',
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      borderTop: '2px solid #7C3AED',
      borderRadius: '8px',
      padding: '12px 16px',
      pointerEvents: 'none', // passivo
      zIndex: 100,
      overflow: 'hidden',
      transition: 'opacity 200ms ease-out, transform 200ms ease-out',
    }}>
      <div style={{ fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: '14px', color: '#FFFFFF', 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayTrack.filename.replace(/\.mp3$/i, '')}
      </div>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayTrack.metadata?.artist ?? 'Unknown Artist'}
      </div>
      <div style={{ fontSize: '10px', color: '#7C3AED', marginTop: '2px' }}>
        {displayTrack.metadata?.genre ?? ''}
      </div>
      {displayTrack.aiDescription && (
        <div style={{
          fontSize: '9px', fontStyle: 'italic', color: '#94A3B8', marginTop: '6px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {displayTrack.aiDescription}
        </div>
      )}
    </div>
  );
}
