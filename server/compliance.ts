import fs from 'fs';
import path from 'path';
import { TrackMetadata } from './types';

const DETAILS_PATH = path.join(process.cwd(), 'src', 'assets', 'details', 'music details.txt');

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
    const blocks = content.split(/^---$/m).map((b) => b.trim()).filter(Boolean);
    const result = new Map<string, TrackMetadata>();
    let lineOffset = 0;

    for (const block of blocks) {
      const titleMatch = block.match(/^(?:Song|M[úu]sica):\s*(.+)$/im);
      if (!titleMatch) {
        console.warn(`[compliance] skipped malformed block at line ~${lineOffset}`);
        lineOffset += block.split('\n').length + 1;
        continue;
      }

      const title = titleMatch[1].trim();
      const artistMatch = block.match(/^(?:Music provided by|M[úu]sica fornecida por)\s*(.+)$/im);
      const downloadMatch = block.match(/^(?:Free Download\/Stream:|Download(?:\/Streaming)? gratuito:)\s*(.+)$/im);
      const watchMatch = block.match(/^(?:Watch:|Assista:)\s*(.+)$/im);

      const metadata: TrackMetadata = {
        title,
        artist: artistMatch?.[1].trim() ?? 'Unknown',
        source: artistMatch?.[1].trim() ?? '',
        downloadLink: downloadMatch?.[1].trim() ?? '',
        watchLink: watchMatch?.[1].trim() ?? '',
      };

      result.set(slugify(title), metadata);
      lineOffset += block.split('\n').length + 1;
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
  const metadata = cache.get(trackId);
  if (metadata) {
    return { valid: true, metadata };
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
