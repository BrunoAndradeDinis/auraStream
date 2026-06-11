import fs from 'fs';
import path from 'path';
import { setState } from './state';
import { TrackInfo } from './types';

const AUDIO_DIR = path.join(process.cwd(), 'src', 'assets', 'audio');

export function loadAudioQueue(): void {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      console.warn(`[server] audio dir not found: ${AUDIO_DIR}`);
      return;
    }

    const files = fs.readdirSync(AUDIO_DIR)
      .filter((f) => f.toLowerCase().endsWith('.mp3'))
      .sort(); // ordem alfabética

    const queue: TrackInfo[] = files.map((filename) => ({
      id: filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-'),
      filename,
      path: path.join(AUDIO_DIR, filename),
    }));

    setState({ queue, currentTrack: queue[0] ?? null });
    console.log(`[server] audio dir scanned: ${queue.length} tracks loaded`);
  } catch (err) {
    console.error('[server] failed to load audio queue:', (err as Error).message);
  }
}
