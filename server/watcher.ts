import chokidar from 'chokidar';
import path from 'path';
import { state, setState } from './state';
import { broadcast } from './broadcast';
import { TrackInfo } from './types';

const AUDIO_DIR = path.join(process.cwd(), 'src', 'assets', 'audio');

export function startAudioWatcher(): void {
  const watcher = chokidar.watch(AUDIO_DIR, {
    ignored: (f: string) => !f.endsWith('.mp3') && !f.endsWith(path.sep),
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    ignoreInitial: true, // we load existing files in loadAudioQueue
  });

  watcher.on('add', (filePath) => {
    const filename = path.basename(filePath);
    if (!filename.toLowerCase().endsWith('.mp3')) return;
    const id = filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-');
    const exists = state.queue.find((t) => t.id === id);
    if (exists) return;
    
    // We create a basic TrackInfo; next story will read metadata
    const track: TrackInfo = { 
      id, 
      filename,
      path: filePath
    };
    
    setState({ queue: [...state.queue, track] });
    broadcast();
    console.log(`[watcher] audio added: ${filename}`);
  });

  watcher.on('unlink', (filePath) => {
    const filename = path.basename(filePath);
    const id = filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-');
    const isCurrentTrack = state.currentTrack?.id === id;
    const newQueue = state.queue.filter((t) => t.id !== id);
    setState({ queue: newQueue });
    broadcast();
    if (isCurrentTrack) {
      // Sinalizar skip — o browser ouve o broadcast e trata, ou podemos emitir media:skip
      import('./broadcast').then(m => m.broadcastEvent('media:skip', {}));
    }
    console.log(`[watcher] audio removed: ${filename}`);
  });
}

import { parseMetadata } from './compliance';

const DETAILS_FILE = path.join(process.cwd(), 'src', 'assets', 'details', 'music details.txt');

export function startMetadataWatcher(): void {
  const watcher = chokidar.watch(DETAILS_FILE, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on('change', () => {
    console.log('[watcher] metadata file updated, re-parsing...');
    parseMetadata();
  });
}
