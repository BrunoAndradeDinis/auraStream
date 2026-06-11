# Story 2.8: Implementar Controles Stop e Restart do Stream

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 2.8                                                                    |
| **Story Key**     | 2-8-implementar-controles-stop-e-restart-do-stream                     |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                             |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~2h                                                                    |
| **Depende de**    | Story 2.7 (reconexão implementada)                                     |

---

## User Story

> **Como** Bruno,
> **Eu quero** poder parar a transmissão encerrando a conexão com o YouTube e reiniciá-la do zero via CLI.

---

## Acceptance Criteria (BDD)

### AC1 — Stop encerra o FFmpeg graciosamente
```gherkin
Given o stream está ativo (`state.status === "streaming"`)
When `media:stop_stream` é recebido
Then o processo FFmpeg é encerrado via SIGTERM, com espera de até 5s antes de SIGKILL
And `state.status` é atualizado para "idle" com broadcast
```

### AC2 — Restart reinicia o pipeline do zero
```gherkin
When `media:restart_stream` é recebido
Then o estado da fila é preservado
And o contador de tentativas de reconexão é zerado
And o pipeline Puppeteer+FFmpeg é relançado do início
```

---

## Contexto para o Agente de Desenvolvimento

### Implementação

Em `server/stream.ts`, adicionar `stopStream()` com SIGTERM + timeout SIGKILL:

```typescript
export async function stopStream(): Promise<void> {
  cancelReconnect();
  if (!ffmpegProcess) return;

  ffmpegProcess.kill('SIGTERM');
  await new Promise<void>((resolve) => {
    const killTimeout = setTimeout(() => {
      ffmpegProcess?.kill('SIGKILL');
      resolve();
    }, 5000);
    ffmpegProcess!.on('close', () => {
      clearTimeout(killTimeout);
      resolve();
    });
  });
  ffmpegProcess = null;
  setState({ status: 'idle' });
  broadcast();
}
```

Handler `media:restart_stream` no switch do servidor:
```typescript
case 'media:restart_stream':
  await stopStream();
  reconnectAttempts = 0;
  isStopped = false;
  await startStream(state.streamKey!);
  break;
```

### Regras Críticas

1. **SIGTERM primeiro, SIGKILL após 5s** — dar ao FFmpeg tempo para encerrar graciosamente.
2. **Fila preservada no restart** — não chamar `loadAudioQueue()` novamente; preservar `state.queue` e `state.currentTrack`.
3. **`isStopped = false`** antes de `startStream()` no restart.

---

## Checklist de Implementação

- [x] Implementar `stopStream()` com SIGTERM + timeout SIGKILL de 5s
- [x] Adicionar handler `media:stop_stream` que chama `stopStream()`
- [x] Adicionar handler `media:restart_stream` (stop → reset → start)
- [x] Verificar: stop → status "idle" com broadcast
- [x] Verificar: restart → fila preservada, pipeline relançado

---

## Dev Agent Record

### Implementation Notes
- O método `stopStream` foi refeito como `async` introduzindo uma closure em Promise aguardando o close event ou timeout de 5 segundos pra aplicar um fallback destrutivo via SIGKILL.
- `media:restart_stream` chama stop e depois chama start com clear da flag de attempts. Fila fica intacta por ser gerenciada pelo módulo global de server state, que fica desacoplado do ciclo de vida da engine ffmpeg.
- CLI atualizado (`server/cli.ts`) para incluir opção visual.

### Completion Notes
✅ Story 2.8 Completa.
Todas as histórias listadas no batch (2.4, 2.5, 2.6, 2.7, 2.8) foram implementadas integralmente com type-checking passando no tsc com strict configs. O épico 2 agora tem todo fluxo de RTMP cobrindo falhas, fallbacks e restart manual.

### File List
- `server/stream.ts` — modificado
- `server/server.ts` — modificado
- `server/cli.ts` — modificado

### Change Log
- 2026-06-11: Story 2.8 implementada — SIGTERM gracefully handles e suporte a restart on-demand.

---

## Status

**Status:** review
