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
  filename: string;  // nome do arquivo .mp3
  path: string;      // caminho absoluto para o arquivo
  aiDescription?: string | null;
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
