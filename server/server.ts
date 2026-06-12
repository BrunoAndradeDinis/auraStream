import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import { state, setState } from './state';
import { broadcast, broadcastEvent, sendToClient } from './broadcast';
import { loadAudioQueue } from './queue';
import { startStream, stopStream, cancelReconnect, restartStream } from './stream';
import { startAudioWatcher, startMetadataWatcher } from './watcher';
import { parseMetadata, validateTrack, auditLog } from './compliance';


const PORT = 9003;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set<WebSocket>();

wss.on('listening', () => {
  console.log(`[server] WS listening on ws://localhost:${PORT}`);
  parseMetadata();
  loadAudioQueue();

  startAudioWatcher();
  startMetadataWatcher();
});

function advanceToNextValidTrack(currentId: string | null): void {
  const queue = state.queue;
  if (queue.length === 0) return;
  const currentIndex = currentId ? queue.findIndex((t) => t.id === currentId) : -1;
  let nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % queue.length;
  let attempts = 0;

  while (attempts < queue.length) {
    const candidate = queue[nextIndex];
    const result = validateTrack(candidate.id);

    if (result.valid) {
      setState({ currentTrack: candidate });
      broadcast();
      auditLog('INFO', 'track_play', candidate.id, 'APPROVED', result.metadata.source);
      return;
    }

    auditLog('WARNING', 'compliance_skip', candidate.id, 'REJECTED', 'not_in_whitelist');
    broadcastEvent('server:compliance_skip', { trackId: candidate.id, reason: 'not_in_whitelist' });
    nextIndex = (nextIndex + 1) % queue.length;
    attempts++;
  }

  setState({ status: 'compliance_blocked', currentTrack: null });
  broadcast();
}

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[server] client connected (total: ${clients.size})`);

  const { streamKey, ...safeState } = state;
  sendToClient(ws, 'server:state_sync', safeState);

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      import('./stream').then(m => m.writeStreamChunk(data as Buffer));
      console.log(`[ws] Received binary chunk: ${(data as Buffer).length} bytes`);
      return;
    }

    let parsed: { event: string; payload?: unknown };
    try {
      parsed = JSON.parse(data.toString());
    } catch (err) {
      console.warn('[server] invalid message from client:', (err as Error).message);
      return;
    }

    const { event, payload } = parsed;
    const start = Date.now();

    switch (event) {
      case 'media:play':
        if (!state.currentTrack) advanceToNextValidTrack(null);
        setState({ status: 'streaming' });
        broadcast();
        broadcastEvent('media:play', {});
        break;
      case 'media:start_stream': {
        const keyToUse = state.streamKey || process.env.YOUTUBE || process.env.YOUTUBE_STREAM_KEY;
        if (!keyToUse) {
          sendToClient(ws, 'server:error', 'stream_key_missing');
          break;
        }
        if (!state.currentTrack) advanceToNextValidTrack(null);
        setState({ status: 'streaming' });
        broadcast();
        broadcastEvent('media:play', {});
        // Confirma para o CLI antes de iniciar o FFmpeg (que pode demorar)
        const { streamKey: _sk1, ...safeState1 } = state;
        sendToClient(ws, 'server:state_sync', safeState1);
        startStream(keyToUse).catch((err) => {
          console.error('[server] falha ao iniciar stream:', err.message ?? err);
          sendToClient(ws, 'server:error', 'stream_start_failed: ' + (err.message ?? String(err)));
        });
        break;
      }
      case 'media:pause':
        setState({ status: 'paused' });
        broadcast();
        broadcastEvent('media:pause', {});
        break;
      case 'media:stop_stream':
        cancelReconnect();
        await stopStream();
        setState({ status: 'idle' });
        broadcast();
        broadcastEvent('media:pause', {});
        { const { streamKey: _sk2, ...safeState2 } = state; sendToClient(ws, 'server:state_sync', safeState2); }
        break;
      case 'media:restart_stream':
        if (!state.streamKey) {
          sendToClient(ws, 'server:error', 'stream_key_missing');
          break;
        }
        if (!state.currentTrack) advanceToNextValidTrack(null);
        setState({ status: 'streaming' });
        broadcast();
        broadcastEvent('media:play', {});
        { const { streamKey: _sk3, ...safeState3 } = state; sendToClient(ws, 'server:state_sync', safeState3); }
        await restartStream(state.streamKey);
        break;
      case 'config:stream_key': {
        setState({ streamKey: payload as string });
        const { streamKey, ...safeState } = state;
        sendToClient(ws, 'server:state_sync', safeState);
        break;
      }
      case 'media:skip':
        if (state.currentTrack) {
          advanceToNextValidTrack(state.currentTrack.id);
        } else {
          advanceToNextValidTrack(null);
        }
        import('./stream').then(m => m.playCurrentTrackAudio());
        broadcastEvent('media:skip', {});
        break;
      case 'media:volume':
        broadcastEvent('media:volume', payload);
        break;
      case 'queue:view': {
        const { streamKey, ...safeState } = state;
        sendToClient(ws, 'server:state_sync', safeState);
        break;
      }
      case 'player:track_changed': {
        const payloadData = payload as { trackId: string };
        const nextTrack = state.queue.find(t => t.id === payloadData.trackId);
        if (nextTrack) {
          const result = validateTrack(nextTrack.id);
          if (!result.valid) {
            auditLog('WARNING', 'compliance_skip', nextTrack.id, 'REJECTED', 'not_in_whitelist');
            broadcastEvent('server:compliance_skip', { trackId: nextTrack.id, reason: 'not_in_whitelist' });
            advanceToNextValidTrack(nextTrack.id);
          } else {
            setState({ currentTrack: nextTrack });
            broadcast();
            import('./stream').then(m => m.playCurrentTrackAudio());
            auditLog('INFO', 'track_play', nextTrack.id, 'APPROVED', result.metadata.source);
          }
        }
        break;
      }
      case 'queue:reorder': {
        const payloadData = payload as { newOrder: string[] };
        if (Array.isArray(payloadData.newOrder)) {
          const newQueue = [];
          const trackMap = new Map(state.queue.map(t => [t.id, t]));
          
          // Add tracks in the new order
          for (const id of payloadData.newOrder) {
            if (trackMap.has(id)) {
              newQueue.push(trackMap.get(id)!);
              trackMap.delete(id);
            }
          }
          
          // Add remaining tracks (e.g., currentTrack if not in newOrder)
          for (const track of trackMap.values()) {
            newQueue.unshift(track); // Put remaining tracks (like currentTrack) at the beginning
          }
          
          setState({ queue: newQueue });
          broadcast();
        }
        break;
      }
      case 'player:queue_looped': {
        console.log('[server] Queue looped');
        break;
      }
      case 'player:error': {
        console.error(`[server] Player error: ${payload}`);
        break;
      }
      case 'timer:set_shutdown': {
        const durationMs = (await import('./shutdown-timer')).SHUTDOWN_PRESETS[payload as string];
        if (!durationMs) { sendToClient(ws, 'server:error', 'Invalid preset'); return; }
        (await import('./shutdown-timer')).scheduleShutdown(durationMs);
        break;
      }
      case 'timer:cancel':
        (await import('./shutdown-timer')).cancelShutdown();
        break;
      default:
        sendToClient(ws, 'server:error', `Unknown event: ${event}`);
        return;
    }

    console.log(`[server] event '${event}' handled in ${Date.now() - start}ms`);
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[server] client disconnected (total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('[server] client error:', err.message);
    clients.delete(ws);
  });
});

export { clients, wss, advanceToNextValidTrack };

