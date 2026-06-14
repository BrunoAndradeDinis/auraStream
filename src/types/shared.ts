export type StreamStatus = 'idle' | 'streaming' | 'paused' | 'reconnecting' | 'offline' | 'compliance_blocked';

export interface TrackInfo {
  id: string;
  filename: string;
  path: string;

  isVerified?: boolean;
  metadata?: {
    title?: string;
    artist: string;
    genre: string;
    source: string;
    song_name?: string;
    author?: string;
    provider?: string;
    download_stream_url?: string;
    watch_url?: string;
    album_image?: string;
  };
}

export interface AppState {
  status: StreamStatus;
  currentTrack: TrackInfo | null;
  queue: TrackInfo[];
  shutdownAt?: number | null;
  shutdownCountdown?: number | null;
}
