import fs from 'fs';
import path from 'path';
import { AppState } from './types';

const CACHE_PATH = path.join(__dirname, 'state-cache.json');

// Estado inicial padrão
const DEFAULT_STATE: AppState = {
  queue: [],
  currentTrack: null,
  status: 'idle',
  streamKey: undefined,
  shutdownAt: null,
};

// Carrega estado do disco ou usa padrão
function loadState(): AppState {
  let state = { ...DEFAULT_STATE };
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
      const persisted = JSON.parse(raw);
      console.log('[server] state loaded from cache');
      state = { ...DEFAULT_STATE, ...persisted };
    }
  } catch (err) {
    console.warn('[server] failed to load state cache, using defaults:', (err as Error).message);
  }

  // Fallback via env — nunca logar o valor
  if (process.env.YOUTUBE_STREAM_KEY) {
    state.streamKey = process.env.YOUTUBE_STREAM_KEY;
  } else if (process.env.YOUTUBE) {
    state.streamKey = process.env.YOUTUBE;
  }

  // Cria o cache pela primeira vez se não existir
  persistStateAsync(state);
  return state;
}

// Persiste estado (sem streamKey) de forma assíncrona
function persistStateAsync(currentState: AppState): void {
  const { streamKey, ...safeState } = currentState;  // exclui streamKey
  fs.writeFile(CACHE_PATH, JSON.stringify(safeState, null, 2), (err) => {
    if (err) console.error('[server] failed to persist state:', err.message);
  });
}

// Estado global em memória
export let state: AppState = loadState();

// Aplica patch parcial e persiste
export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  persistStateAsync(state);
}
