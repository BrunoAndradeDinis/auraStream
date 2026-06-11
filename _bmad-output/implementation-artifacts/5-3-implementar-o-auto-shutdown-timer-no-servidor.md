# Story 5.3: Implementar o Auto-Shutdown Timer no Servidor

## Metadados

| Campo             | Valor                                                              |
|-------------------|--------------------------------------------------------------------|
| **Story ID**      | 5.3                                                                |
| **Story Key**     | 5-3-implementar-o-auto-shutdown-timer-no-servidor                  |
| **Epic**          | Epic 5 — Automação e Descrições via IA *(Opcional)*                |
| **Status**        | ready-for-dev                                                      |
| **Esforço Est.**  | ~3h                                                                |
| **Depende de**    | Story 1.4 (broadcast), Story 1.6 (CLI menu)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** configurar um timer de encerramento automático com presets de tempo,
> **Para que** eu inicie uma sessão de rádio e confie que ela encerrará no horário correto sem supervisão.

---

## Acceptance Criteria (BDD)

### AC1 — Agendamento do shutdown
```gherkin
Given Bruno seleciona "Set Auto-Shutdown" na CLI e escolhe preset (ex: "2 hours")
When o preset é confirmado
Then servidor armazena `state.shutdownAt = Date.now() + durationMs` e emite broadcast com timestamp alvo
And servidor calcula timer secundário para `shutdownAt - 5min` emitindo `server:shutdown_warning`
And `setInterval` de 1s atualiza `state.shutdownCountdown` com segundos restantes
And precisão de ±5s
```

### AC2 — Presets disponíveis
```gherkin
Given Bruno seleciona "Set Auto-Shutdown" na CLI
When o menu de presets é exibido
Then as opções são: 1h, 2h, 4h, 8h, 24h, 3 days, 1 week, 3 weeks
```

---

## Contexto para o Agente de Desenvolvimento

### Implementação de `server/shutdown-timer.ts`

```typescript
import { state, setState } from './state';
import { broadcast } from './broadcast';

let countdownInterval: NodeJS.Timeout | null = null;
let warningTimeout: NodeJS.Timeout | null = null;
let shutdownTimeout: NodeJS.Timeout | null = null;

export const SHUTDOWN_PRESETS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3 days': 3 * 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
  '3 weeks': 21 * 24 * 60 * 60 * 1000,
};

export function scheduleShutdown(durationMs: number): void {
  cancelShutdown();
  const shutdownAt = Date.now() + durationMs;
  setState({ shutdownAt });
  broadcast();

  // Warning 5min antes
  const warningDelay = durationMs - 5 * 60 * 1000;
  if (warningDelay > 0) {
    warningTimeout = setTimeout(() => {
      broadcast(); // broadcast com shutdownAt → frontend exibe warning
      // Evento dedicado para toast no frontend
    }, warningDelay);
  }

  // Shutdown no tempo exato
  shutdownTimeout = setTimeout(() => {
    // Tratado pela Story 5.4
    import('./shutdown-sequence').then(({ executeGracefulShutdown }) => executeGracefulShutdown());
  }, durationMs);

  // Countdown a cada 1s
  countdownInterval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((state.shutdownAt! - Date.now()) / 1000));
    setState({ shutdownCountdown: remaining });
    broadcast();
  }, 1000);
}

export function cancelShutdown(): void {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  if (warningTimeout) { clearTimeout(warningTimeout); warningTimeout = null; }
  if (shutdownTimeout) { clearTimeout(shutdownTimeout); shutdownTimeout = null; }
  setState({ shutdownAt: null, shutdownCountdown: null });
  broadcast();
}
```

### Adicionar ao `AppState` em `server/types.ts`
```typescript
shutdownCountdown?: number | null; // segundos restantes
```

### Handler CLI — Adicionar opção "Set Auto-Shutdown" em `server/cli.ts`

```typescript
case 'timer:set_shutdown': {
  const { preset } = await inquirer.prompt([{
    type: 'list',
    name: 'preset',
    message: 'Select auto-shutdown duration:',
    choices: Object.keys(SHUTDOWN_PRESETS),
  }]);
  const result = await sendCommand('timer:set_shutdown', preset);
  if (!result) { showServerError(); break; }
  console.log(chalk.green(`✓ Auto-shutdown scheduled: ${preset}`));
  break;
}
```

Handler no servidor:
```typescript
case 'timer:set_shutdown': {
  const durationMs = SHUTDOWN_PRESETS[payload as string];
  if (!durationMs) { sendToClient(ws, 'server:error', 'Invalid preset'); return; }
  scheduleShutdown(durationMs);
  break;
}
case 'timer:cancel':
  cancelShutdown();
  break;
```

---

## Checklist de Implementação

- [ ] Adicionar `shutdownAt` e `shutdownCountdown` em `AppState`/`server/types.ts`
- [ ] Criar `server/shutdown-timer.ts` com `scheduleShutdown()` e `cancelShutdown()`
- [ ] Adicionar handlers `timer:set_shutdown` e `timer:cancel` no servidor
- [ ] Adicionar opção "Set Auto-Shutdown" na CLI
- [ ] Verificar: countdown atualiza a cada 1s via broadcast
- [ ] Verificar: warning emitido 5min antes

---

## Status

**Status:** ready-for-dev
