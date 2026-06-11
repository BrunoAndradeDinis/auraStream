import { setState } from './state';
import { broadcast } from './broadcast';
import { stopStream } from './stream';
import { auditLog } from './compliance';
import { cancelShutdown } from './shutdown-timer';

export async function executeGracefulShutdown(): Promise<void> {
  console.log('[shutdown] Executing scheduled shutdown sequence...');

  // 1. Pausar áudio
  setState({ status: 'paused' });
  broadcast();

  // 2. Aguardar 5s
  await new Promise((r) => setTimeout(r, 5000));

  // 3. Parar stream
  await stopStream();

  // 4. Audit log
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  auditLog('INFO', 'scheduled_shutdown', 'system', 'APPROVED', `Scheduled shutdown at ${hhmm}`);

  // 5. Status idle + cancelar timer
  cancelShutdown();
  setState({ status: 'idle' });
  broadcast();

  console.log(`[shutdown] Scheduled shutdown completed at ${hhmm}`);
}
