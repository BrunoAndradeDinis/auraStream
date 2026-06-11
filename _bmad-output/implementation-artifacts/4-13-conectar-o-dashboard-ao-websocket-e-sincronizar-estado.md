# Story 4.13: Conectar o Dashboard ao WebSocket e Sincronizar Estado em Tempo Real

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 4.13                                                                           |
| **Story Key**     | 4-13-conectar-o-dashboard-ao-websocket-e-sincronizar-estado                    |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                   |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~4h                                                                            |
| **Depende de**    | Story 1.5 (state sync), Story 4.2 (layout Dashboard)                          |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o Dashboard se conecte automaticamente ao WebSocket e reflita qualquer mudança de estado em menos de 100ms.

---

## Acceptance Criteria (BDD)

### AC1 — Conexão inicial e sync
```gherkin
Given o servidor WebSocket está rodando em ws://localhost:9003 e Bruno acessa o Dashboard
When a página monta
Then hook `useWebSocket` conecta ao servidor e recebe `server:state_sync` inicial populando estado React em menos de 100ms
```

### AC2 — Atualizações parciais sem re-render completo
```gherkin
When eventos subsequentes chegam (`server:state_sync`, `server:compliance_skip`, `server:stream_failed`)
Then apenas os componentes afetados são atualizados
And o Dashboard não faz re-render completo da árvore inteira
```

### AC3 — Reconexão automática
```gherkin
When o servidor fica indisponível
Then Dashboard exibe banner `⚠️ Connection lost — retrying...`
And tenta reconectar a cada 3s
When conexão restaurada
Then banner desaparece e estado é sincronizado com snapshot atual
```

---

## Contexto para o Agente de Desenvolvimento

### Hook `useWebSocket` (criado na Story 2.2)

Reutilizar e extender o hook `src/hooks/use-websocket.ts` para suportar reconexão automática:

```typescript
export function useWebSocket(onMessage: (event: string, payload: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const ws = new WebSocket('ws://localhost:9003');
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      // Reconectar após 3s
      setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);
        onMessage(event, payload);
      } catch { /* ignore */ }
    };
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const send = useCallback((event: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  return { send, isConnected };
}
```

### Banner de Conexão Perdida

```tsx
{!isConnected && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
    background: '#F59E0B', color: '#000', textAlign: 'center', padding: '8px',
    fontFamily: 'Outfit', fontWeight: 600,
  }}>
    ⚠️ Connection lost — retrying...
  </div>
)}
```

### Estado Global do Dashboard

Usar `useState` com o `AppState` completo e atualizar via `setAppState` no handler de `server:state_sync`. Usar `useMemo` para derivar valores específicos (ex: queue sem currentTrack) evitando re-renders.

### Regras Críticas

1. **Reconexão a cada 3s** — usar `setTimeout` no handler `onclose` (não `setInterval`).
2. **Sem loop infinito** — o `useCallback` do `connect` depende de `onMessage`, que por sua vez deve ser estabilizado com `useCallback` no componente pai.
3. **`url ws://localhost:9003`** — hardcoded para dev. Em produção, usar variável de ambiente `NEXT_PUBLIC_WS_URL`.

---

## Nota Importante — Ordem de Implementação

Esta story é referenciada como dependência por Stories 4.3–4.8. Na prática, o hook `useWebSocket` deve ser implementado **antes ou junto** das stories de componentes, pois elas dependem dos dados do estado. Recomenda-se implementar 4.13 primeiro dentro do Epic 4.

---

## Checklist de Implementação

- [x] Atualizar `src/hooks/use-websocket.ts` com reconexão automática a cada 3s
- [x] Implementar estado global `AppState` no Dashboard com `useState`
- [x] Adicionar banner `⚠️ Connection lost — retrying...`
- [x] Conectar todos os componentes (4.3–4.8) ao estado via props
- [x] Verificar: estado sincronizado < 100ms após conexão
- [x] Verificar: banner aparece ao desconectar e desaparece ao reconectar

---

## Dev Agent Record

### Implementation Notes
- Hook re-trabalhado para incluir um timeout automático e alert banner caso perca ligação.
- Dados unificados utilizando `AppState` model como base pra dashboard page.

### Completion Notes
✅ Story 4.13 terminada. Todos os mock states trocados pela connection.

### Change Log
- 2026-06-11: AppState unificado e gerido de forma central.

---

## Status

**Status:** review
