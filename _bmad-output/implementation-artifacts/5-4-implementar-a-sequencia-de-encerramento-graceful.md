# Story 5.4: Implementar a Sequência de Encerramento Graceful do Auto-Shutdown

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 5.4                                                                        |
| **Story Key**     | 5-4-implementar-a-sequencia-de-encerramento-graceful                       |
| **Epic**          | Epic 5 — Automação e Descrições via IA *(Opcional)*                        |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~3h                                                                        |
| **Depende de**    | Story 5.3 (timer), Story 2.8 (stop stream), Story 3.6 (audit logger)     |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o Auto-Shutdown execute uma sequência ordenada de ações ao atingir o tempo limite.

---

## Acceptance Criteria (BDD)

### AC1 — Sequência de shutdown
```gherkin
Given o timer atingiu `state.shutdownAt`
When o encerramento é disparado
Then executa em ordem:
  1. Emite `media:pause` (para áudio)
  2. Aguarda 5s
  3. Emite `media:stop_stream` (desconecta stream)
  4. Loga no `compliance-audit.jsonl`: `{"event":"scheduled_shutdown","status":"APPROVED",...}`
  5. Atualiza `state.status` para "idle"
And timer é cancelado após execução
```

### AC2 — Cancelamento antes do disparo
```gherkin
Given o timer está pendente
When `{ "event": "timer:cancel" }` é recebido
Then nenhuma ação de encerramento é executada
And `state.shutdownAt` é zerado
```

---

## Contexto para o Agente de Desenvolvimento

### Implementação de `server/shutdown-sequence.ts`

```typescript
import { setState } from './state';
import { broadcast } from './broadcast';
import { stopStream } from './stream';
import { auditLog } from './compliance';
import { cancelShutdown } from './shutdown-timer';

export async function executeGracefulShutdown(): Promise<void> {
  console.log('[shutdown] Executing scheduled shutdown sequence...');

  // 1. Pausar áudio
  setState({ status: 'paused' });
  broadcast();

  // 2. Aguardar 5s
  await new Promise((r) => setTimeout(r, 5000));

  // 3. Parar stream
  await stopStream();

  // 4. Audit log
  const now = new Date();
  const hhmm = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  auditLog('INFO', 'scheduled_shutdown', 'system', 'APPROVED', `Scheduled shutdown at ${hhmm}`);

  // 5. Status idle + cancelar timer
  cancelShutdown();
  setState({ status: 'idle' });
  broadcast();

  console.log(`[shutdown] Scheduled shutdown completed at ${hhmm}`);
}
```

### Regras Críticas

1. **`stopStream()` da Story 2.8** — reutilizar; não reimplementar o encerramento do FFmpeg.
2. **`auditLog()` da Story 3.6** — logar o shutdown no compliance-audit.jsonl.
3. **Sequence garantida** — usar `await` em cada etapa para garantir ordem.
4. **`cancelShutdown()`** — limpar todos os timers após a sequência para evitar disparo duplo.

---

## Checklist de Implementação

- [ ] Criar `server/shutdown-sequence.ts` com `executeGracefulShutdown()`
- [ ] Importar e chamar em `shutdown-timer.ts` no `setTimeout` do shutdown
- [ ] Verificar: sequência executada na ordem correta (pause → 5s → stop → log → idle)
- [ ] Verificar: `timer:cancel` impede execução da sequência
- [ ] Verificar: entrada no `compliance-audit.jsonl` após shutdown

---

## Status

**Status:** ready-for-dev
