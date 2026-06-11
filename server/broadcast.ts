import { WebSocket } from 'ws';
import { clients } from './server';
import { state } from './state';

export function broadcast(excludeClient?: WebSocket): void {
  const { streamKey, ...safeState } = state; // exclude streamKey

  const message = JSON.stringify({
    event: 'server:state_sync',
    payload: safeState,
  });

  for (const client of clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function broadcastEvent(event: string, payload: unknown, excludeClient?: WebSocket): void {
  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function sendToClient(client: WebSocket, event: string, payload: unknown): void {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ event, payload }));
  }
}
