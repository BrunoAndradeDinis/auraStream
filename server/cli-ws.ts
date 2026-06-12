import WebSocket from 'ws';

const WS_URL = 'ws://localhost:9003';

// Comandos de stream podem demorar mais para responder
const STREAM_COMMANDS = new Set([
  'media:start_stream',
  'media:stop_stream',
  'media:restart_stream',
]);

export async function sendCommand(
  event: string,
  payload?: unknown
): Promise<Record<string, unknown> | null> {
  const timeoutMs = STREAM_COMMANDS.has(event) ? 10_000 : 5_000;

  return new Promise((resolve) => {
    let ws: WebSocket;
    let resolved = false;
    let statePayload: Record<string, unknown> | null = null;

    const done = (result: Record<string, unknown> | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      ws?.close();
      resolve(result);
    };

    const timeout = setTimeout(() => {
      // Para comandos de stream, um timeout não significa falha —
      // o servidor está processando em background. Retorna o
      // último state_sync recebido (ou um objeto vazio como sinal de OK).
      done(statePayload ?? { status: 'processing' });
    }, timeoutMs);

    try {
      ws = new WebSocket(WS_URL);
    } catch {
      done(null);
      return;
    }

    ws.on('error', (err) => {
      console.error('[cli-ws] connection error:', err.message);
      done(null);
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({ event, payload }));
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.event === 'server:state_sync') {
          // Guarda o state mais recente
          statePayload = msg.payload as Record<string, unknown>;
          // Para comandos que não são de stream, resolve imediatamente
          if (!STREAM_COMMANDS.has(event)) {
            done(statePayload);
          }
        } else if (msg.event === 'server:error') {
          console.error('[cli-ws] server error:', msg.payload);
          done(null);
        }
        // Para comandos de stream, aguarda o timeout para dar tempo ao server
      } catch {
        done(null);
      }
    });
  });
}
