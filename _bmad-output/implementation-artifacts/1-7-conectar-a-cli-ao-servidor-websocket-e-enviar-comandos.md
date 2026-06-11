# Story 1.7: Conectar a CLI ao Servidor WebSocket e Enviar Comandos

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 1.7                                                                        |
| **Story Key**     | 1-7-conectar-a-cli-ao-servidor-websocket-e-enviar-comandos                 |
| **Epic**          | Epic 1 — Fundação do Servidor e Comunicação em Tempo Real                  |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~4h                                                                        |
| **Depende de**    | Story 1.5 (estado sincronizado), Story 1.6 (menu CLI implementado)        |

---

## User Story

> **Como** Bruno,
> **Eu quero** que cada opção do menu da CLI envie o evento WebSocket correto para o servidor e exiba a resposta em menos de 200ms,
> **Para que** os comandos do terminal tenham efeito imediato no estado do sistema.

---

## Acceptance Criteria (BDD)

### AC1 — Envio de comando e resposta via WebSocket

```gherkin
Given o servidor WebSocket está rodando em `ws://localhost:9003`
When Bruno seleciona uma opção no menu da CLI (ex: "Skip Track")
Then a CLI conecta ao WebSocket, envia `{ "event": "media:skip" }` e aguarda a resposta `server:state_sync`
And exibe a confirmação da ação em menos de 200ms após o envio
```

### AC2 — Servidor indisponível → mensagem de erro sem crash

```gherkin
Given o servidor WebSocket NÃO está rodando
When Bruno seleciona qualquer opção no menu
Then a CLI exibe `[ERROR] Server not running. Start with: npm run server`
And a CLI volta ao menu principal sem crash nem process.exit não intencional
```

### AC3 — Configure Stream Key com input mascarado

```gherkin
Given Bruno seleciona "Configure Stream Key"
When digita a chave no campo do terminal
Then o campo usa `type: 'password'` (caracteres aparecem como asteriscos)
And a chave é enviada via `{ "event": "config:stream_key", "payload": "rtmp://..." }`
And em nenhum momento a chave aparece em texto plano nos logs do terminal
```

### AC4 — View Queue exibe fila atual

```gherkin
Given o servidor tem faixas em `state.queue`
When Bruno seleciona "View Queue"
Then a CLI exibe a lista de faixas com índice e nome em formato tabular
And retorna ao menu após exibir (sem enviar evento WebSocket)
```

---

## Contexto para o Agente de Desenvolvimento

### Padrão de Conexão WebSocket na CLI

A CLI deve abrir uma conexão WebSocket **por ação** (connect → send → wait → disconnect), não manter conexão persistente. Isso simplifica o gerenciamento de estado e evita reconexão automática desnecessária.

### Helper de Conexão

Criar `server/cli-ws.ts`:

```typescript
import WebSocket from 'ws';
import chalk from 'chalk';

const WS_URL = 'ws://localhost:9003';
const TIMEOUT_MS = 3000;

export async function sendCommand(
  event: string,
  payload?: unknown
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    let ws: WebSocket;
    const timeout = setTimeout(() => {
      ws?.close();
      resolve(null); // timeout = null → erro
    }, TIMEOUT_MS);

    try {
      ws = new WebSocket(WS_URL);
    } catch {
      clearTimeout(timeout);
      resolve(null);
      return;
    }

    ws.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({ event, payload }));
    });

    ws.on('message', (raw) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'server:state_sync') {
          ws.close();
          resolve(msg.payload);
        }
      } catch {
        ws.close();
        resolve(null);
      }
    });
  });
}
```

### Integração em `server/cli.ts`

Substituir o `handleAction` placeholder da Story 1.6:

```typescript
import { sendCommand } from './cli-ws';
import inquirer from 'inquirer';
import chalk from 'chalk';

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case 'queue:view': {
      const state = await sendCommand('queue:view');
      if (!state) { showServerError(); break; }
      const queue = (state as any).queue ?? [];
      if (queue.length === 0) {
        console.log(chalk.gray('Queue is empty.'));
      } else {
        queue.forEach((t: any, i: number) => {
          console.log(chalk.cyan(`${i + 1}.`) + ` ${t.filename}`);
        });
      }
      await pause();
      break;
    }

    case 'config:stream_key': {
      const { key } = await inquirer.prompt([{
        type: 'password',
        name: 'key',
        message: 'Enter YouTube Stream Key:',
        mask: '*',
      }]);
      const result = await sendCommand('config:stream_key', key);
      if (!result) { showServerError(); break; }
      console.log(chalk.green('✓ Stream key configured.'));
      await pause();
      break;
    }

    case 'system:view_logs': {
      // Exibe últimas 20 linhas do compliance log
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.join(process.cwd(), 'logs', 'compliance-audit.jsonl');
      if (fs.existsSync(logPath)) {
        const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n').slice(-20);
        lines.forEach((l) => console.log(chalk.gray(l)));
      } else {
        console.log(chalk.gray('No logs yet.'));
      }
      await pause();
      break;
    }

    default: {
      console.log(chalk.yellow('[Connecting to server...]'));
      const result = await sendCommand(action);
      if (!result) { showServerError(); break; }
      console.log(chalk.green(`✓ Command '${action}' executed. Status: ${(result as any).status}`));
      await pause();
      break;
    }
  }
  await showMenu();
}

function showServerError(): void {
  console.log(chalk.red('[ERROR] Server not running. Start with: npm run server'));
}

async function pause(): Promise<void> {
  await inquirer.prompt([{ type: 'input', name: '_', message: 'Press Enter to continue...' }]);
}
```

### Mapa de Eventos CLI → WebSocket

| Opção CLI           | Evento enviado              | Payload          |
|---------------------|-----------------------------|------------------|
| Start Streaming     | `media:start_stream`        | —                |
| Pause               | `media:pause`               | —                |
| Continue            | `media:play`                | —                |
| Stop                | `media:stop_stream`         | —                |
| Skip Track          | `media:skip`                | —                |
| View Queue          | `queue:view` (local)        | lê state local   |
| Configure Stream Key| `config:stream_key`         | string da chave  |
| View Logs           | (local, lê arquivo)         | —                |

### Regras Críticas

1. **`type: 'password'` + `mask: '*'`** para Stream Key — obrigatório, não negociável.
2. **Stream Key NUNCA em `console.log`** — nem mesmo parcialmente. Não logar payload do `config:stream_key`.
3. **Timeout de 3000ms** no helper `sendCommand` — se o servidor não responder em 3s, exibir erro.
4. **Conexão por ação** — não manter WebSocket persistente na CLI. Conectar, enviar, receber, fechar.
5. **`queue:view` e `system:view_logs`** são operações locais — sem evento WebSocket, apenas leitura de estado recebido ou arquivo.

---

## Checklist de Implementação

- [ ] Criar `server/cli-ws.ts` com helper `sendCommand`
- [ ] Substituir `handleAction` placeholder em `server/cli.ts` com lógica completa
- [ ] Verificar: "Start Streaming" envia `media:start_stream` e exibe confirmação < 200ms
- [ ] Verificar: servidor offline → mensagem de erro sem crash
- [ ] Verificar: "Configure Stream Key" usa `type: 'password'` e não loga a chave
- [ ] Verificar: "View Queue" exibe faixas corretamente
- [ ] Verificar: "View Logs" lê o arquivo `logs/compliance-audit.jsonl`

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
