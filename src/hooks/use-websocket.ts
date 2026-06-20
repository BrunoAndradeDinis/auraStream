'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:9003';

export function useWebSocket(onMessage: (event: string, payload: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Ref para o timer de reconexão — permite cancelamento no cleanup
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Evita criar múltiplas conexões simultâneas
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      // Cancela qualquer timer pendente antes de criar um novo
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);
        onMessage(event, payload);
      } catch { /* ignore malformed */ }
    };
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      // Cancela reconexão pendente e fecha a conexão ao desmontar
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  const sendBinary = useCallback((blob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(blob);
    }
  }, []);

  return { send, sendBinary, isConnected };
}
