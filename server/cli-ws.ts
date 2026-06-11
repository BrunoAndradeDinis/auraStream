import WebSocket from 'ws';

const WS_URL = 'ws://localhost:9003';
const TIMEOUT_MS = 3000;

export async function sendCommand(
  event: string,
  payload?: unknown
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    let ws: WebSocket;
    const timeout = setTimeout(() => {
      ws?.close();
      resolve(null); // timeout = null → erro
    }, TIMEOUT_MS);

    try {
      ws = new WebSocket(WS_URL);
    } catch {
      clearTimeout(timeout);
      resolve(null);
      return;
    }

    ws.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({ event, payload }));
    });

    ws.on('message', (raw) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'server:state_sync') {
          ws.close();
          resolve(msg.payload);
        }
      } catch {
        ws.close();
        resolve(null);
      }
    });
  });
}
