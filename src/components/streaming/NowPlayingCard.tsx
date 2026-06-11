'use client';
import { TrackInfo } from '@/types/shared';

export function NowPlayingCard({ currentTrack }: { currentTrack: TrackInfo | null }) {
  if (!currentTrack) {
    return (
      <div className="glass-card flex items-center justify-center min-h-[120px]" style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
        No tracks in queue — add .mp3 files to ./src/assets/audio/
      </div>
    );
  }

  return (
    <div className="glass-card" style={{
      border: '2px solid var(--color-primary)',
      boxShadow: '0 0 12px rgba(0, 240, 255, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div className="text-[10px] font-bold text-primary mb-2 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary pulse"></span>
        Now Playing
      </div>
      <div style={{ fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: '20px', color: '#FFFFFF' }} className="truncate">
        {currentTrack.filename.replace(/\.mp3$/i, '')}
      </div>
      <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>
        {/* Artista virá dos metadados (Story 3.3) — placeholder por enquanto */}
        Unknown Artist
      </div>
      <WaveformPlaceholder />
    </div>
  );
}

function WaveformPlaceholder() {
  // Barras animadas simulando waveform
  return (
    <div style={{ display: 'flex', gap: '3px', marginTop: '16px', alignItems: 'flex-end', height: '24px' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          width: '4px',
          background: 'var(--color-primary)',
          borderRadius: '2px',
          animation: `waveform 0.8s ease-in-out ${i * 0.05}s infinite alternate`,
          height: `${Math.random() * 16 + 4}px`,
        }} />
      ))}
    </div>
  );
}
