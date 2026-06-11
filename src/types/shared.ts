export type StreamStatus = 'idle' | 'streaming' | 'paused' | 'reconnecting' | 'offline' | 'compliance_blocked';

export interface TrackInfo {
  id: string;
  filename: string;
  path: string;
  aiDescription?: string | null;
  isVerified?: boolean;
  metadata?: {
    title?: string;
    artist: string;
    genre: string;
    source: string;
  };
}

export interface AppState {
  status: StreamStatus;
  currentTrack: TrackInfo | null;
  queue: TrackInfo[];
  shutdownAt?: number | null;
  shutdownCountdown?: number | null;
}
