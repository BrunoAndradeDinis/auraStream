import fs from 'fs';
import path from 'path';
import { TrackMetadata } from './types';

const DETAILS_PATH = path.join(process.cwd(), 'src', 'assets', 'details', 'music-details.json');

// Cache em memória — substituído atomicamente a cada parseMetadata()
let metadataCache: Map<string, TrackMetadata> = new Map();

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, '-');
}

export function parseMetadata(): Map<string, TrackMetadata> {
  try {
    if (!fs.existsSync(DETAILS_PATH)) {
      console.warn(`[compliance] metadata file not found at ${DETAILS_PATH}`);
      return metadataCache;
    }
    
    const content = fs.readFileSync(DETAILS_PATH, 'utf-8');
    const data = JSON.parse(content);
    const result = new Map<string, TrackMetadata>();

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item.song || !item.song.song_name) continue;
      
      const title = item.song.song_name;
      const metadata: TrackMetadata = {
        title,
        artist: item.song.author ?? 'Unknown',
        source: item.provider ?? '',
        downloadLink: item.download_stream_url ?? '',
        watchLink: item.watch_url ?? '',
      };

      // We'll use a unique key for the map (like index) but matching will iterate over values
      result.set(`track-${i}`, metadata);
    }

    metadataCache = result; // substituição atômica
    console.log(`[compliance] parsed ${result.size} tracks from metadata file`);
    return result;
  } catch (err) {
    console.error('[compliance] failed to parse metadata:', (err as Error).message);
    return metadataCache; // retorna cache anterior em caso de erro
  }
}

export function getMetadataCache(): Map<string, TrackMetadata> {
  return metadataCache;
}

import { ValidationResult } from './types';

export function validateTrack(trackId: string): ValidationResult {
  const cache = getMetadataCache();
  
  for (const metadata of cache.values()) {
    const nameToMatch = metadata.title.split(' (')[0].split(' [')[0].toLowerCase().replace(/\s+/g, '-');
    if (trackId.includes(nameToMatch)) {
      return { valid: true, metadata };
    }
  }
  
  return { valid: false, reason: 'not_in_whitelist' };
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'compliance-audit.jsonl');

export function auditLog(
  level: 'INFO' | 'WARNING' | 'ERROR',
  event: string,
  trackId: string,
  status: 'APPROVED' | 'REJECTED',
  details: string
): void {
  // Criar diretório se não existir
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    trackId,
    status,
    details,
  });

  fs.appendFile(LOG_FILE, entry + '\n', (err) => {
    if (err) console.error('[compliance] failed to write audit log:', err.message);
  });
}
