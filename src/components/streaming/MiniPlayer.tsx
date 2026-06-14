'use client';
import { useState, useEffect } from 'react';
import { TrackInfo } from '@/types/shared';

interface MiniPlayerProps {
  currentTrack: TrackInfo | null;
}

export function MiniPlayer({ currentTrack }: MiniPlayerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [displayTrack, setDisplayTrack] = useState<TrackInfo | null>(currentTrack);

  useEffect(() => {
    if (!currentTrack || !currentTrack.filename) {
      setIsVisible(false);
      setTimeout(() => setDisplayTrack(null), 200);
      return;
    }

    if (displayTrack?.filename === currentTrack.filename) {
      // Same track, update instantly to avoid blinking
      setDisplayTrack(currentTrack);
      setIsVisible(true);
      return;
    }

    // Fade out
    setIsVisible(false);
    const timer = setTimeout(() => {
      setDisplayTrack(currentTrack);
      setIsVisible(true); // Fade in
    }, 200);

    return () => clearTimeout(timer);
  }, [currentTrack?.filename]);

  if (!displayTrack) return null;

  return (
    <>
      {displayTrack.metadata?.album_image && (
        <div className={`miniplayer-glow ${isVisible ? 'miniplayer-enter' : 'opacity-0 scale-95 pointer-events-none'}`} style={{
          position: 'fixed',
          bottom: '340px',
          right: '40px',
          width: '480px',
          height: '480px',
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          borderTop: '3px solid #7C3AED',
          borderRadius: '12px',
          padding: '12px',
          pointerEvents: 'none',
          zIndex: 100,
          overflow: 'hidden',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={displayTrack.metadata.album_image} 
            alt="Album Art" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
          />
        </div>
      )}
      <div className={`miniplayer-glow ${isVisible ? 'miniplayer-enter' : 'opacity-0 scale-95 pointer-events-none'}`} style={{
        position: 'fixed',
        bottom: '80px',
        right: '40px',
        width: '480px',
        height: '240px',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        borderTop: '3px solid #7C3AED',
        borderRadius: '12px',
        padding: '20px 24px',
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}>
        <div style={{ fontFamily: 'var(--font-outfit)', fontWeight: 900, fontSize: '21px', color: '#FFFFFF',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayTrack.metadata?.song_name || displayTrack.filename.replace(/\.mp3$/i, '')}
        </div>
        <div style={{ fontWeight: 700, fontSize: '18px', color: '#94A3B8', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayTrack.metadata?.author || displayTrack.metadata?.artist || 'Unknown Artist'}
        </div>
        <div style={{ fontWeight: 600, fontSize: '15px', color: '#7C3AED', marginTop: '6px' }}>
          {displayTrack.metadata?.provider || displayTrack.metadata?.genre || ''}
        </div>

        <div style={{ marginTop: '16px', borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
          {displayTrack.metadata?.watch_url && (
            <div style={{ fontWeight: 500, fontSize: '21px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
              <span style={{ color: '#EF4444', marginRight: '6px' }}>▶</span> {displayTrack.metadata.watch_url.replace(/https?:\/\//, '')}
            </div>
          )}
          {displayTrack.metadata?.download_stream_url && (
            <div style={{ fontWeight: 500, fontSize: '21px', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#3B82F6', marginRight: '6px' }}>⬇</span> {displayTrack.metadata.download_stream_url.replace(/https?:\/\//, '')}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
