import { state, setState } from './state';
import { broadcast, broadcastEvent } from './broadcast';

let countdownInterval: NodeJS.Timeout | null = null;
let warningTimeout: NodeJS.Timeout | null = null;
let shutdownTimeout: NodeJS.Timeout | null = null;

export const SHUTDOWN_PRESETS: Record<string, number> = {
  '1m': 60 * 1000, // Just for testing
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3 days': 3 * 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
  '3 weeks': 21 * 24 * 60 * 60 * 1000,
};

export function scheduleShutdown(durationMs: number): void {
  cancelShutdown();
  const shutdownAt = Date.now() + durationMs;
  setState({ shutdownAt });
  broadcast();

  // Warning 5min antes
  const warningDelay = durationMs - 5 * 60 * 1000;
  if (warningDelay > 0) {
    warningTimeout = setTimeout(() => {
      broadcast(); // broadcast com shutdownAt → frontend exibe warning
      broadcastEvent('server:shutdown_warning', { remainingMs: 5 * 60 * 1000 });
    }, warningDelay);
  }

  // Shutdown no tempo exato
  shutdownTimeout = setTimeout(() => {
    import('./shutdown-sequence').then(({ executeGracefulShutdown }) => executeGracefulShutdown()).catch(e => {
        console.error('Failed to execute graceful shutdown', e);
    });
  }, durationMs);

  // Countdown a cada 1s
  countdownInterval = setInterval(() => {
    if (!state.shutdownAt) {
      clearInterval(countdownInterval!);
      return;
    }
    const remaining = Math.max(0, Math.floor((state.shutdownAt - Date.now()) / 1000));
    setState({ shutdownCountdown: remaining });
    broadcast();
  }, 1000);
}

export function cancelShutdown(): void {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  if (warningTimeout) { clearTimeout(warningTimeout); warningTimeout = null; }
  if (shutdownTimeout) { clearTimeout(shutdownTimeout); shutdownTimeout = null; }
  setState({ shutdownAt: null, shutdownCountdown: null });
  broadcast();
}
