import { state, setState } from './state';
import { broadcast } from './broadcast';

const AI_ENDPOINT = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-description` 
  : 'http://localhost:9002/api/ai/generate-description';
const TIMEOUT_MS = 5000;

export async function generateDescription(trackIndex: number): Promise<void> {
  const track = state.queue[trackIndex];
  if (!track || track.aiDescription !== undefined) return; // já gerada ou null explícito

  const title = track.metadata?.title ?? track.filename.replace(/\.mp3$/i, '');
  const artist = track.metadata?.artist ?? 'Unknown Artist';
  const genre = track.metadata?.genre ?? 'Unknown Genre';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, genre }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { description } = await response.json();

    const newQueue = [...state.queue];
    newQueue[trackIndex] = { ...newQueue[trackIndex], aiDescription: description ?? null };
    setState({ queue: newQueue });
    broadcast();
    console.log(`[ai] description generated for: ${title}`);
  } catch (err) {
    const newQueue = [...state.queue];
    newQueue[trackIndex] = { ...newQueue[trackIndex], aiDescription: null };
    setState({ queue: newQueue });
    broadcast();
    console.warn(`[ai] failed to generate description for ${title}:`, (err as Error).message);
  }
}

// Gera em batch para toda a fila (não bloqueante)
export function generateAllDescriptions(): void {
  state.queue.forEach((_: any, i: number) => {
    // Escalonado para não sobrecarregar a API
    setTimeout(() => generateDescription(i), i * 1500);
  });
}
