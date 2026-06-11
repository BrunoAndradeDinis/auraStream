# Story 3.5: Implementar o Auto-Skip de Faixas Não Conformes

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 3.5                                                                    |
| **Story Key**     | 3-5-implementar-o-auto-skip-de-faixas-nao-conformes                    |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                         |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 3.4 (validateTrack), Story 3.6 (audit logger)                   |

---

## User Story

> **Como** Bruno,
> **Eu quero** que qualquer faixa que falhe na validação NCS seja automaticamente pulada,
> **Para que** o canal nunca transmita música sem certificação NCS.

---

## Acceptance Criteria (BDD)

### AC1 — Faixa inválida é pulada antes do play
```gherkin
Given a fila tem faixas conformes e não conformes
When o servidor processa transição para nova faixa (início ou `player:track_changed`)
Then chama `validateTrack()` antes de emitir `media:play` ao browser
And se `valid === false`, pula para próxima faixa sem emitir `media:play` para a rejeitada
And emite broadcast `{ "event": "server:compliance_skip", "payload": { "trackId": "...", "reason": "not_in_whitelist" } }`
```

### AC2 — Todas as faixas inválidas bloqueiam o stream
```gherkin
Given TODAS as faixas da fila são não conformes
When o servidor tenta iniciar a reprodução
Then para o stream com `state.status = "compliance_blocked"`
And notifica todos os clientes via broadcast
```

---

## Contexto para o Agente de Desenvolvimento

### Onde Implementar

No handler de `player:track_changed` em `server/server.ts`, e na lógica de início do stream:

```typescript
function advanceToNextValidTrack(currentId: string): void {
  const queue = state.queue;
  const currentIndex = queue.findIndex((t) => t.id === currentId);
  let nextIndex = (currentIndex + 1) % queue.length;
  let attempts = 0;

  while (attempts < queue.length) {
    const candidate = queue[nextIndex];
    const result = validateTrack(candidate.id);

    if (result.valid) {
      setState({ currentTrack: candidate });
      broadcast();
      auditLog('INFO', 'track_play', candidate.id, 'APPROVED', result.metadata.source);
      // Sinalizar ao browser para tocar via broadcast (browser observa mudança de currentTrack)
      return;
    }

    // Auto-skip
    auditLog('WARNING', 'compliance_skip', candidate.id, 'REJECTED', 'not_in_whitelist');
    broadcastEvent('server:compliance_skip', { trackId: candidate.id, reason: 'not_in_whitelist' });
    nextIndex = (nextIndex + 1) % queue.length;
    attempts++;
  }

  // Todas as faixas inválidas
  setState({ status: 'compliance_blocked', currentTrack: null });
  broadcast();
}
```

### Regras Críticas

1. **`validateTrack()` antes de qualquer `media:play`** — não tocar uma faixa sem validação.
2. **Loop de tentativas limitado** por `queue.length` para evitar loop infinito.
3. **`auditLog()`** da Story 3.6 deve ser chamado aqui para cada decisão.
4. **`compliance_blocked`** — adicionar ao tipo `StreamStatus` em `server/types.ts`.

---

## Checklist de Implementação

- [ ] Implementar `advanceToNextValidTrack()` em `server/server.ts` ou módulo dedicado
- [ ] Integrar no handler `player:track_changed` e no início do stream
- [ ] Verificar: faixas inválidas puladas com broadcast `server:compliance_skip`
- [ ] Verificar: todas inválidas → status `compliance_blocked`

---

## Status

**Status:** ready-for-dev
