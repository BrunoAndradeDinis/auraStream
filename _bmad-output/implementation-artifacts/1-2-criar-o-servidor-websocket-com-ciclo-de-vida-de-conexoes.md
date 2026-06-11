# Story 1.2: Criar o Servidor WebSocket com Ciclo de Vida de Conexões

## Metadados

| Campo             | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| **Story ID**      | 1.2                                                                   |
| **Story Key**     | 1-2-criar-o-servidor-websocket-com-ciclo-de-vida-de-conexoes          |
| **Epic**          | Epic 1 — Fundação do Servidor e Comunicação em Tempo Real             |
| **Status**        | ready-for-dev                                                         |
| **Esforço Est.**  | ~2h                                                                   |
| **Depende de**    | Story 1.1 (dependências e scripts configurados)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o arquivo `server/server.ts` suba um servidor WebSocket funcional na porta 9003,
> **Para que** clientes (CLI e browser) possam se conectar e desconectar sem erros.

---

## Acceptance Criteria (BDD)

### AC1 — Servidor inicia e escuta na porta 9003

```gherkin
Given as dependências da Story 1.1 estão instaladas
When `npm run server` é executado
Then o terminal exibe `[server] WS listening on ws://localhost:9003`
And o processo permanece ativo aguardando conexões
```

### AC2 — Log de conexão de cliente

```gherkin
Given o servidor está rodando em ws://localhost:9003
When um cliente WebSocket se conecta
Then o servidor loga `[server] client connected (total: N)` onde N é o número atual de conexões ativas
```

### AC3 — Log de desconexão sem crash

```gherkin
Given um ou mais clientes estão conectados
When um cliente desconecta (fecha a aba, mata o processo CLI, etc.)
Then o servidor loga `[server] client disconnected (total: N)` com o total atualizado
And o servidor continua rodando sem crash ou erro não tratado
```

### AC4 — Estabilidade sob múltiplas conexões/desconexões

```gherkin
Given o servidor está rodando
When múltiplos clientes conectam e desconectam consecutivamente (5+ ciclos)
Then o servidor permanece estável sem memory leak ou crash
And o contador `total` reflete sempre o número correto de conexões ativas
```

---

## Contexto para o Agente de Desenvolvimento

### Pré-condições

A Story 1.1 deve estar concluída:
- `npm install` executado com `ws`, `ts-node`, `@types/ws`, `inquirer@8.2.6`
- `tsconfig.server.json` existindo com `module: "commonjs"`, `target: "es2020"`
- Scripts `"server"` e `"cli"` no `package.json`
- Placeholder `/server/server.ts` existindo (será substituído por esta story)

### O que deve ser implementado em `server/server.ts`

```typescript
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 9003;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set<WebSocket>();

wss.on('listening', () => {
  console.log(`[server] WS listening on ws://localhost:${PORT}`);
});

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[server] client connected (total: ${clients.size})`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[server] client disconnected (total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('[server] client error:', err.message);
    clients.delete(ws);
  });
});
```

> **Nota:** A lógica de mensagens (`ws.on('message', ...)`) será adicionada nas Stories 1.4 e 1.5. Esta story implementa apenas o ciclo de vida de conexão.

### Regras de Arquitetura

1. **Porta 9003 é sagrada** — nunca alterar para 9002 (porta do Next.js).
2. **`clients` é um `Set<WebSocket>`** — será exportado/compartilhado com o módulo de broadcast (Story 1.4). Manter como variável de módulo no topo do arquivo.
3. **Erros de cliente não devem matar o servidor** — sempre tratar `ws.on('error', ...)` para remover o cliente do Set sem deixar conexão zumbi.
4. **Sem `http.Server` adicional** — o `WebSocketServer` da biblioteca `ws` sobe seu próprio servidor HTTP implícito. Não criar um servidor HTTP Express ou nativo separado nesta story.
5. **Exportar `clients` e `wss`** para uso nas stories subsequentes:
   ```typescript
   export { clients, wss };
   ```

### Dependências

- `ws` ^8.18.0 (já instalado na Story 1.1)
- `@types/ws` ^8.5.13 (já instalado na Story 1.1)
- `ts-node` com `tsconfig.server.json` (já configurado na Story 1.1)

---

## Checklist de Implementação

- [ ] Substituir o placeholder `server/server.ts` pela implementação completa
- [ ] Verificar: `npm run server` exibe `[server] WS listening on ws://localhost:9003`
- [ ] Testar: conectar via `wscat` ou script simples e verificar logs de `connected`/`disconnected`
- [ ] Verificar: processo não crasha após desconexão de cliente
- [ ] Exportar `clients` e `wss` para uso nas próximas stories

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
