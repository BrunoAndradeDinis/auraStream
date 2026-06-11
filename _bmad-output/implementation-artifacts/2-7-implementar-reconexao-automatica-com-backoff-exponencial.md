# Story 2.7: Implementar Reconexão Automática com Backoff Exponencial

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 2.7                                                                        |
| **Story Key**     | 2-7-implementar-reconexao-automatica-com-backoff-exponencial               |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                                 |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~3h                                                                        |
| **Depende de**    | Story 2.6 (pipeline RTMP implementado)                                     |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o sistema tente reconectar automaticamente ao YouTube caso o processo FFmpeg caia inesperadamente,
> **Para que** transmissões longas se recuperem de quedas de rede sem intervenção manual.

---

## Acceptance Criteria (BDD)

### AC1 — Backoff exponencial em até 5 tentativas
```gherkin
Given o stream está ativo e o processo FFmpeg cai (exit code ≠ 0)
When o evento `close` do processo FFmpeg é detectado
Then o servidor aguarda `2^tentativa` segundos (2s, 4s, 8s, 16s, 32s) antes de cada tentativa
And são realizadas no máximo 5 tentativas
And cada tentativa loga `[stream] reconnect attempt N/5`
```

### AC2 — Falha após 5 tentativas
```gherkin
Given 5 tentativas foram realizadas sem sucesso
When a última tentativa falha
Then `state.status` é marcado como "offline"
And emite `{ "event": "server:stream_failed" }` com broadcast para todos
```

### AC3 — Cancelamento durante reconexão
```gherkin
Given a reconexão está em andamento (aguardando backoff)
When `media:stop_stream` é recebido
Then todas as tentativas pendentes são canceladas imediatamente
And nenhuma reconexão adicional é tentada
```

---

## Contexto para o Agente de Desenvolvimento

### Implementação em `server/stream.ts`

```typescript
let reconnectAttempts = 0;
const MAX_ATTEMPTS = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isStopped = false;

export function handleStreamDrop(): void {
  if (isStopped || reconnectAttempts >= MAX_ATTEMPTS) {
    setState({ status: 'offline' });
    broadcast();
    broadcastEvent('server:stream_failed', null);
    return;
  }

  reconnectAttempts++;
  const delay = Math.pow(2, reconnectAttempts) * 1000;
  console.log(`[stream] reconnect attempt ${reconnectAttempts}/${MAX_ATTEMPTS} in ${delay}ms`);
  setState({ status: 'reconnecting' });
  broadcast();

  reconnectTimeout = setTimeout(async () => {
    if (isStopped) return;
    try {
      await startStream(state.streamKey!);
      reconnectAttempts = 0; // reset em sucesso
    } catch {
      handleStreamDrop(); // tenta novamente
    }
  }, delay);
}

export function cancelReconnect(): void {
  isStopped = true;
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = null;
  reconnectAttempts = 0;
}
```

### Integração

- Chamar `handleStreamDrop()` no `ffmpegProcess.on('close', (code) => { if (code !== 0) handleStreamDrop(); })` da Story 2.6.
- Chamar `cancelReconnect()` no handler `media:stop_stream`.
- Resetar `isStopped = false` ao iniciar um novo stream.

### Regras Críticas

1. **`2^tentativa`** — 1ª tentativa = 2s, 2ª = 4s, 3ª = 8s, 4ª = 16s, 5ª = 32s.
2. **Máximo 5 tentativas** — após a 5ª falha, status = "offline" + `server:stream_failed`.
3. **`isStopped` flag** — necessário para cancelar tentativas pendentes ao receber `media:stop_stream`.
4. **Reset de `reconnectAttempts`** ao iniciar novo stream bem-sucedido.

---

## Checklist de Implementação

- [ ] Adicionar lógica de reconexão com backoff em `server/stream.ts`
- [ ] Integrar `handleStreamDrop` no evento `close` do FFmpeg (Story 2.6)
- [ ] Adicionar `cancelReconnect()` ao handler `media:stop_stream`
- [ ] Verificar: logs `[stream] reconnect attempt N/5` aparecem no timing correto
- [ ] Verificar: após 5 tentativas → status "offline" + `server:stream_failed`
- [ ] Verificar: `media:stop_stream` durante reconexão cancela todas as tentativas

---

## Status

**Status:** ready-for-dev
