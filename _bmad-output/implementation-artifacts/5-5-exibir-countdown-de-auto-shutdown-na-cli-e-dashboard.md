# Story 5.5: Exibir Countdown de Auto-Shutdown na CLI e no Dashboard

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 5.5                                                                        |
| **Story Key**     | 5-5-exibir-countdown-de-auto-shutdown-na-cli-e-dashboard                   |
| **Epic**          | Epic 5 — Automação e Descrições via IA *(Opcional)*                        |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~2h                                                                        |
| **Depende de**    | Story 5.3 (timer + shutdownCountdown no estado), Story 4.13 (WebSocket)   |

---

## User Story

> **Como** Bruno,
> **Eu quero** que ambas as interfaces exibam o tempo restante para o auto-shutdown.

---

## Acceptance Criteria (BDD)

### AC1 — CLI exibe countdown
```gherkin
Given `state.shutdownAt` não é null e o countdown está ativo
When a CLI exibe o status
Then uma linha `⏱ Auto-shutdown in: HH:MM:SS` é exibida em Cyan
```

### AC2 — Dashboard exibe badge
```gherkin
When o Dashboard está aberto com shutdownAt ativo
Then badge `⏱ HH:MM:SS` é exibido na sidebar próximo ao Live Status, atualizando a cada segundo
```

### AC3 — Oculto quando inativo
```gherkin
When `state.shutdownAt === null`
Then nenhum countdown é exibido em nenhuma interface
```

### AC4 — Toast de aviso 5 min antes
```gherkin
When `server:shutdown_warning` é recebido
Then toast aparece na UI: `⚠️ Stream shutting down in 5 minutes`
```

---

## Contexto para o Agente de Desenvolvimento

### CLI — Exibir countdown no menu

No `showMenu()` de `server/cli.ts`, antes de exibir as opções, checar o estado:

```typescript
if (state.shutdownCountdown && state.shutdownCountdown > 0) {
  const h = Math.floor(state.shutdownCountdown / 3600).toString().padStart(2, '0');
  const m = Math.floor((state.shutdownCountdown % 3600) / 60).toString().padStart(2, '0');
  const s = (state.shutdownCountdown % 60).toString().padStart(2, '0');
  console.log(chalk.cyan(`⏱ Auto-shutdown in: ${h}:${m}:${s}`));
}
```

> **Nota:** A CLI usa conexão por ação (Story 1.7) — o `state.shutdownCountdown` está no payload do `server:state_sync` recebido ao conectar. Mostrar o valor recebido no momento da conexão (não atualiza em tempo real na CLI).

### Dashboard — Badge na Sidebar

Em `src/components/streaming/LiveStatusCard.tsx` ou `Sidebar`, adicionar:

```tsx
{appState.shutdownCountdown && appState.shutdownCountdown > 0 && (
  <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-primary)', fontSize: '11px', marginTop: '8px' }}>
    ⏱ {formatUptime(appState.shutdownCountdown)}
  </div>
)}
```

O `shutdownCountdown` já atualiza a cada 1s via broadcast (Story 5.3).

### Toast de Aviso — Handler no WebSocket do Dashboard

```typescript
case 'server:shutdown_warning':
  showToast('⚠️ Stream shutting down in 5 minutes', 'warning');
  break;
```

---

## Checklist de Implementação

- [ ] Adicionar exibição do countdown no `showMenu()` da CLI
- [ ] Adicionar badge de countdown na Sidebar do Dashboard
- [ ] Adicionar handler `server:shutdown_warning` → toast
- [ ] Verificar: countdown atualiza a cada 1s no Dashboard
- [ ] Verificar: badge/linha ocultos quando `shutdownAt === null`
- [ ] Verificar: toast aparece ao receber `server:shutdown_warning`

---

## Status

**Status:** ready-for-dev
