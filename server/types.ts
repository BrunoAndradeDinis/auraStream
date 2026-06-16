export interface TrackMetadata {
  title: string;
  artist: string;
  source: string;
  downloadLink: string;
  watchLink: string;
}

export type ValidationResult =
  | { valid: true; metadata: TrackMetadata }
  | { valid: false; reason: 'not_in_whitelist' };

export interface TrackInfo {
  id: string;        // slug normalizado do título
  filename: string;  // agora serve como nome de referência
  path: string;      // agora guarda a URL do s3_audio_url
  s3_audio_url?: string;
  s3_video_url?: string;
  album_image?: string;

  isVerified?: boolean;
  metadata?: {
    title?: string;
    artist: string;
    genre: string;
    source: string;
  };
}

export type StreamStatus = 'idle' | 'streaming' | 'paused' | 'reconnecting' | 'offline' | 'compliance_blocked';

export interface AppState {
  status: StreamStatus;
  currentTrack: TrackInfo | null;
  queue: TrackInfo[];
  streamKey?: string;
  shutdownAt?: number | null;
  shutdownCountdown?: number | null;
}
