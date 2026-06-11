# Story 2.4: Implementar Controles de Áudio via Eventos WebSocket

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 2.4                                                                        |
| **Story Key**     | 2-4-implementar-controles-de-audio-via-eventos-websocket                   |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                                 |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~3h                                                                        |
| **Depende de**    | Story 2.3 (crossfade), Story 1.4 (broadcast)                              |

---

## User Story

> **Como** Bruno,
> **Eu quero** que os eventos `media:play`, `media:pause`, `media:skip` e `media:volume` sejam tratados pelo browser e afetem a reprodução em tempo real.

---

## Acceptance Criteria (BDD)

### AC1 — Pause suspende AudioContext
```gherkin
When `media:pause` é recebido
Then `context.suspend()` é chamado; WebSocket permanece aberto
```

### AC2 — Play retoma sem reiniciar
```gherkin
When `media:play` é recebido após pause
Then `context.resume()` é chamado; faixa continua do ponto onde parou
```

### AC3 — Skip inicia crossfade
```gherkin
When `media:skip` é recebido
Then crossfade de 500ms inicia para a próxima faixa (Story 2.3)
```

### AC4 — Volume ajustado em 100ms
```gherkin
When `{ "event": "media:volume", "payload": 0.7 }` é recebido
Then GainNode master ajusta para 0.7 em 100ms via `linearRampToValueAtTime`
```

---

## Contexto para o Agente de Desenvolvimento

### Integração no Frontend

No handler de mensagens WebSocket do `page.tsx`:

```typescript
switch (event) {
  case 'media:pause':   audioEngine.pause(); break;
  case 'media:play':    audioEngine.resume(); break;
  case 'media:skip':    handleSkip(); break;
  case 'media:volume':  audioEngine.setVolume(payload as number); break;
}
```

### Regras Críticas

1. Usar `context.suspend()` / `context.resume()` — não `stop()` nem `close()`.
2. Volume payload entre 0.0–1.0 — validar antes de aplicar.
3. Ramp de 100ms: `gain.linearRampToValueAtTime(v, ctx.currentTime + 0.1)`.
4. O browser é o motor de áudio — o servidor apenas retransmite comandos via broadcast.

---

## Checklist de Implementação

- [x] Handlers para `media:pause`, `media:play`, `media:skip`, `media:volume` no WebSocket listener do frontend
- [x] Verificar: pause → áudio para, WebSocket ativo
- [x] Verificar: play após pause → retoma do ponto exato
- [x] Verificar: skip → crossfade 500ms imediato
- [x] Verificar: volume 0.7 → ajuste gradual sem clique audível

---

## Dev Agent Record

### Implementation Notes

- Modificado o payload do servidor no handler de mensagens para que comandos restritos `media:pause`, `media:skip`, `media:volume` emitam de fato um socket broadcastEvent que chega ao cliente.
- Implementada a leitura do WebSocket na interface de React interpretando essas instâncias e utilizando os métodos nativos da Web Audio API (`resume()`, `suspend()`, `setVolume()`, e `advanceTrack()`).
- O volume age usando o mesmo conceito de Ramp (`linearRampToValueAtTime`) da story anterior com 100ms em vez de corte direto, o que diminui clicks audíveis nas freqüências.

### Completion Notes

✅ Story 2.4 Completa.
- O Frontend e a CLI agora estão operacionais lado-a-lado podendo um acionar a ação pelo prompt da node CLI e o Next.js agir alterando a reprodução através do motor sem reload ou paradas bruscas no loop de playback.

### File List
- `server/broadcast.ts` — modificado (adicionado `broadcastEvent()`)
- `server/server.ts` — modificado (integrando handlers)
- `src/app/page.tsx` — modificado (volume state mapping)

### Change Log
- 2026-06-11: Story 2.4 implementada — Integração dos controles de playback real-time com CLI.

---

## Status

**Status:** review
