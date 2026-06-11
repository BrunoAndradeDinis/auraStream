# Story 4.7: Implementar o Log Monitor no Painel Inferior

## Metadados

| Campo             | Valor                                                              |
|-------------------|--------------------------------------------------------------------|
| **Story ID**      | 4.7                                                                |
| **Story Key**     | 4-7-implementar-o-log-monitor-no-painel-inferior                   |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic       |
| **Status**        | ready-for-dev                                                      |
| **Esforço Est.**  | ~2h                                                                |
| **Depende de**    | Story 4.13 (WebSocket hook)                                        |

---

## User Story

> **Como** Bruno,
> **Eu quero** um painel de logs exibindo as últimas 20 ações do sistema em tempo real.

---

## Acceptance Criteria (BDD)

### AC1 — Logs em tempo real
```gherkin
Given o Dashboard está conectado ao WebSocket
When qualquer evento relevante ocorre
Then nova linha adicionada ao topo com timestamp em JetBrains Mono e ícone colorido
  - ✅ INFO, ⚠️ WARNING, ❌ ERROR
And painel mantém no máximo 20 linhas (remove a mais antiga)
```

### AC2 — Features do painel
```gherkin
Then painel tem scroll vertical interno
And botão `Clear` limpa as entradas localmente
And linhas de compliance skip destacadas em amarelo âmbar
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Criar `src/components/streaming/LogMonitor.tsx`:

```tsx
'use client';
import { useState, useCallback } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  isCompliance?: boolean;
}

export function LogMonitor({ onNewEvent }: { onNewEvent: (addLog: (entry: Omit<LogEntry, 'id'>) => void) => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs((prev) => [
      { ...entry, id: crypto.randomUUID() },
      ...prev.slice(0, 19), // mantém max 20
    ]);
  }, []);

  // Expor addLog para o parent via callback
  useEffect(() => { onNewEvent(addLog); }, [onNewEvent, addLog]);

  const ICONS = { INFO: '✅', WARNING: '⚠️', ERROR: '❌' };
  const COLORS = { INFO: 'var(--color-text)', WARNING: '#F59E0B', ERROR: '#EF4444' };

  return (
    <div className="glass-card" style={{ height: '200px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>System Logs</span>
        <button onClick={() => setLogs([])}>Clear</button>
      </div>
      {logs.map((log) => (
        <div key={log.id} style={{
          color: log.isCompliance ? '#F59E0B' : COLORS[log.level],
          fontFamily: 'JetBrains Mono',
          fontSize: '11px',
          padding: '2px 0',
        }}>
          {ICONS[log.level]} [{log.timestamp}] {log.message}
        </div>
      ))}
    </div>
  );
}
```

### Eventos que geram logs no Dashboard

- `server:state_sync` com mudança de status → log INFO
- `server:compliance_skip` → log WARNING (isCompliance: true, amarelo âmbar)
- `server:stream_failed` → log ERROR
- `player:track_changed` → log INFO

---

## Checklist de Implementação

- [ ] Criar `LogMonitor.tsx`
- [ ] Integrar no painel inferior do Dashboard
- [ ] Conectar ao WebSocket para receber eventos e adicionar logs
- [ ] Verificar: max 20 linhas, remove mais antiga
- [ ] Verificar: compliance_skip aparece em amarelo âmbar
- [ ] Verificar: botão Clear limpa entradas locais

---

## Status

**Status:** ready-for-dev
