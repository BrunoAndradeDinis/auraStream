# Story 2.5: Configurar Gestão Segura da Stream Key

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 2.5                                                                    |
| **Story Key**     | 2-5-configurar-gestao-segura-da-stream-key                             |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                             |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~2h                                                                    |
| **Depende de**    | Story 1.7 (CLI conectada ao WebSocket)                                 |

---

## User Story

> **Como** Bruno,
> **Eu quero** que a Stream Key do YouTube possa ser configurada via CLI e armazenada apenas em memória no servidor,
> **Para que** ela esteja disponível para o pipeline FFmpeg sem nunca aparecer em logs ou arquivos.

---

## Acceptance Criteria (BDD)

### AC1 — Configuração via CLI com input mascarado
```gherkin
Given Bruno seleciona "Configure Stream Key" na CLI
When Bruno digita a chave no campo mascarado e confirma
Then a CLI envia `{ "event": "config:stream_key", "payload": "rtmp://..." }` via WebSocket
And o servidor armazena a chave em `state.streamKey` (memória apenas)
And a chave NÃO é gravada em state-cache.json, logs, nem console.log
```

### AC2 — Erro ao iniciar stream sem Stream Key
```gherkin
Given `state.streamKey` é null
When o servidor recebe `media:start_stream`
Then retorna `{ "event": "server:error", "payload": "stream_key_missing" }` ao cliente
And nenhum processo FFmpeg é iniciado
```

### AC3 — Fallback via variável de ambiente
```gherkin
Given `process.env.YOUTUBE_STREAM_KEY` está definido no `.env`
When o servidor inicia
Then `state.streamKey` é pré-populado com o valor da variável de ambiente
And o valor nunca aparece em logs de inicialização
```

---

## Contexto para o Agente de Desenvolvimento

### Carregamento do `.env`

O projeto já tem `dotenv` como dependência. No início de `server/server.ts`:
```typescript
import 'dotenv/config'; // deve ser a PRIMEIRA importação
```

### Inicialização da streamKey

Em `server/state.ts`, no `loadState()`, adicionar após carregar o cache:
```typescript
// Fallback via env — nunca logar o valor
if (process.env.YOUTUBE_STREAM_KEY) {
  state.streamKey = process.env.YOUTUBE_STREAM_KEY;
}
```

### Handler `config:stream_key` no Servidor

Já tratado na Story 1.4, mas confirmar que:
1. `setState({ streamKey: payload })` é chamado.
2. `broadcast()` **NÃO** é chamado após config:stream_key (a chave não vai para clientes).
3. `sendToClient(ws, 'server:state_sync', state)` envia confirmação apenas ao emissor — e `state` serializado já exclui `streamKey`.

### Regras Críticas

1. **Triple check: `streamKey` nunca em disco, nunca em broadcast, nunca em `console.log`**.
2. **`dotenv/config` como primeira import** em `server/server.ts`.
3. **Validação no handler `media:start_stream`**: se `!state.streamKey`, retornar `server:error` com `stream_key_missing`.

---

## Checklist de Implementação

- [x] Adicionar `import 'dotenv/config'` como primeira linha de `server/server.ts`
- [x] Carregar `YOUTUBE_STREAM_KEY` do `.env` como fallback no `loadState()`
- [x] Confirmar handler `config:stream_key` não faz broadcast da chave
- [x] Adicionar guard em `media:start_stream` para verificar streamKey
- [x] Verificar: chave não aparece em nenhum log
- [x] Verificar: `.env` com `YOUTUBE_STREAM_KEY` pré-popula o estado

---

## Dev Agent Record

### Implementation Notes

- Modificado `server.ts` colocando `dotenv/config` e incluindo o guard de segurança `stream_key_missing` previnindo o broadcast e start do FFmpeg.
- Refatorado levemente o state.ts adicionando a injeção do `.env` dentro da RAM, sem perturbar o cache de disco com JSONs sensíveis.

### Completion Notes

✅ Story 2.5 Integrada e segura.
- Foi validada a regra de ouro que as keys nunca descem ao lado cliente, `server/broadcast.ts` explicitamente dropa da interface. 

### File List
- `server/server.ts` — modificado
- `server/state.ts` — modificado

### Change Log
- 2026-06-11: Story 2.5 implementada — Proteção contra leakage de stream keys e fallback de env adicionados.

---

## Status

**Status:** review
