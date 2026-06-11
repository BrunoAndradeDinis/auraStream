# Story 1.5: Implementar Sincronização de Estado para Novos Clientes

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 1.5                                                                        |
| **Story Key**     | 1-5-implementar-sincronizacao-de-estado-para-novos-clientes                |
| **Epic**          | Epic 1 — Fundação do Servidor e Comunicação em Tempo Real                  |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~2h                                                                        |
| **Depende de**    | Story 1.4 (broadcasting implementado)                                      |

---

## User Story

> **Como** Bruno,
> **Eu quero** que qualquer cliente que se conecte ao servidor receba imediatamente o estado atual da transmissão,
> **Para que** o Dashboard e a CLI sempre mostrem a situação real ao abrir.

---

## Acceptance Criteria (BDD)

### AC1 — Estado enviado imediatamente ao novo cliente

```gherkin
Given o servidor está rodando com estado não-vazio (ex: `{ "status": "streaming", "queue": [...] }`)
When um novo cliente WebSocket se conecta
Then o servidor envia imediatamente `{ "event": "server:state_sync", "payload": { ...estadoAtual } }` como primeira mensagem
And o envio ocorre em menos de 100ms após a conexão ser estabelecida
```

### AC2 — Envio inicial NÃO é broadcast para outros clientes

```gherkin
Given dois clientes A e B estão conectados e recebendo eventos
When um terceiro cliente C se conecta
Then apenas C recebe o `server:state_sync` inicial
And clientes A e B NÃO recebem essa mensagem de sincronização inicial
```

### AC3 — Estado vazio no primeiro boot

```gherkin
Given o servidor acabou de iniciar (sem cache) com estado padrão `{ "queue": [], "currentTrack": null, "status": "idle" }`
When um cliente se conecta
Then ele recebe `{ "event": "server:state_sync", "payload": { "queue": [], "currentTrack": null, "status": "idle" } }`
```

---

## Contexto para o Agente de Desenvolvimento

### Implementação

Esta story é pequena — apenas adicionar um `sendToClient` imediato no handler de conexão em `server/server.ts`.

No bloco `wss.on('connection', (ws) => { ... })`, **logo após** adicionar o cliente ao Set e logar a conexão:

```typescript
wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[server] client connected (total: ${clients.size})`);

  // --- STORY 1.5: Enviar estado atual imediatamente ao novo cliente ---
  sendToClient(ws, 'server:state_sync', state);
  // ------------------------------------------------------------------

  ws.on('message', (raw) => { /* Story 1.4 */ });
  ws.on('close', () => { /* Story 1.2 */ });
  ws.on('error', (err) => { /* Story 1.2 */ });
});
```

### Regras Críticas

1. **`sendToClient` (não `broadcast`)** — usar a função `sendToClient(ws, ...)` de `server/broadcast.ts`, que envia apenas para o socket específico.
2. **Antes de qualquer `ws.on('message')`** — a sincronização deve acontecer na conexão, antes do cliente enviar qualquer mensagem.
3. **`streamKey` não vai no payload** — a serialização do `state` via `JSON.stringify` em `sendToClient` deve excluir `streamKey`. Verificar se `state` exportado de `server/state.ts` já faz isso, ou adicionar exclusão explícita.

### Verificação Rápida

Para testar manualmente:
```bash
# Terminal 1: iniciar servidor com status não-padrão
npm run server

# Terminal 2: conectar novo cliente (wscat ou script node)
npx wscat -c ws://localhost:9003
# deve receber imediatamente: {"event":"server:state_sync","payload":{...}}
```

---

## Checklist de Implementação

- [ ] Adicionar `sendToClient(ws, 'server:state_sync', state)` no handler de conexão (Stories 1.2/1.4)
- [ ] Confirmar que a chamada é exclusiva ao novo cliente (não `broadcast`)
- [ ] Verificar: cliente recebe state_sync < 100ms após conexão
- [ ] Verificar: clientes existentes não recebem o envio inicial do novo cliente

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
