# Story 2.3: Implementar Crossfade Suave entre Faixas (500ms)

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 2.3                                                                    |
| **Story Key**     | 2-3-implementar-crossfade-suave-entre-faixas-500ms                     |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                             |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~4h                                                                    |
| **Depende de**    | Story 2.2 (Web Audio API operacional)                                  |

---

## User Story

> **Como** Bruno,
> **Eu quero** que a transição entre duas faixas seja feita com crossfade de 500ms via `GainNode` da Web Audio API,
> **Para que** não haja silêncio ou corte abrupto perceptível pelos espectadores do YouTube.

---

## Acceptance Criteria (BDD)

### AC1 — Crossfade ao fim da faixa atual

```gherkin
Given o áudio da faixa atual está tocando no browser
When a faixa atual termina (evento `onended`)
Then um `GainNode` faz fade-out da faixa atual de `1.0 → 0.0` em 500ms via `linearRampToValueAtTime`
And simultaneamente a próxima faixa inicia com `GainNode` fazendo fade-in de `0.0 → 1.0` em 500ms
And após o crossfade, o servidor recebe `{ "event": "player:track_changed", "payload": { "trackId": "..." } }`
```

### AC2 — Crossfade ao receber media:skip

```gherkin
Given o áudio está tocando
When o evento `media:skip` é recebido via WebSocket
Then o crossfade de 500ms é iniciado imediatamente para a próxima faixa
And o comportamento é idêntico ao AC1
```

### AC3 — Loop de fila ao chegar ao fim

```gherkin
Given a fila tem 3 faixas e a última está tocando
When ela termina
Then o sistema retorna à primeira faixa da fila
And emite `{ "event": "player:queue_looped" }` ao servidor
```

---

## Contexto para o Agente de Desenvolvimento

### Técnica de Crossfade com Dois GainNodes

O crossfade requer dois nós paralelos — um para a faixa saindo (fade-out) e outro para a faixa entrando (fade-in):

```typescript
async function crossfadeTo(nextTrackPath: string, ctx: AudioContext, masterGain: GainNode) {
  const FADE_MS = 0.5; // 500ms em segundos
  const now = ctx.currentTime;

  // Fade out da faixa atual
  const outGain = ctx.createGain();
  outGain.gain.setValueAtTime(1.0, now);
  outGain.gain.linearRampToValueAtTime(0.0, now + FADE_MS);
  // conectar source atual a outGain → masterGain

  // Fade in da próxima faixa
  const response = await fetch(nextTrackPath);
  const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
  const inSource = ctx.createBufferSource();
  inSource.buffer = buffer;
  const inGain = ctx.createGain();
  inGain.gain.setValueAtTime(0.0, now);
  inGain.gain.linearRampToValueAtTime(1.0, now + FADE_MS);
  inSource.connect(inGain);
  inGain.connect(masterGain);
  inSource.start(now);

  // Após o fade, limpar nó antigo
  setTimeout(() => outGain.disconnect(), FADE_MS * 1000 + 100);
}
```

### Atualização de `use-audio-engine.ts`

Adicionar método `crossfadeTo(nextTrack: TrackInfo, onEnd: () => void)` ao hook criado na Story 2.2.

### Evento `player:track_changed`

Após crossfade completo, enviar via `useWebSocket.send`:
```typescript
send('player:track_changed', { trackId: nextTrack.id });
```

O servidor deve atualizar `state.currentTrack` ao receber este evento.

### Regras Críticas

1. **`linearRampToValueAtTime`** — usar esta função específica (não `exponentialRampToValueAtTime`) conforme AC1.
2. **FADE_MS = 0.5** (segundos) — equivale a 500ms. Usar variável nomeada para consistência.
3. **Pré-carregar próxima faixa** — o `fetch` + `decodeAudioData` deve ocorrer antes ou durante o fade-out para não haver delay. Iniciar o fetch ao menos 500ms antes do fim da faixa atual (via `setTimeout` baseado na duração do buffer).
4. **`player:queue_looped`** — emitir ao servidor quando a fila reinicia do topo.

---

## Checklist de Implementação

- [ ] Implementar `crossfadeTo()` no hook `use-audio-engine.ts`
- [ ] Conectar `onended` do source atual ao trigger de crossfade
- [ ] Conectar recebimento de `media:skip` ao crossfade
- [ ] Enviar `player:track_changed` após crossfade completo
- [ ] Enviar `player:queue_looped` ao lopar a fila
- [ ] Verificar: crossfade audível sem silêncio perceptível
- [ ] Verificar: `media:skip` aciona crossfade imediatamente

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
