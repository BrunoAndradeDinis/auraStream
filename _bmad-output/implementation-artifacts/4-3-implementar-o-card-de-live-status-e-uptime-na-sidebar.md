# Story 4.3: Implementar o Card de Live Status e Uptime na Sidebar

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 4.3                                                                    |
| **Story Key**     | 4-3-implementar-o-card-de-live-status-e-uptime-na-sidebar              |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic           |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~2h                                                                    |
| **Depende de**    | Story 4.2 (layout sidebar), Story 4.13 (WebSocket hook no frontend)   |

---

## User Story

> **Como** Bruno,
> **Eu quero** que a sidebar exiba o status atual da transmissão com indicador colorido e contador de uptime,
> **Para que** eu saiba instantaneamente o estado da live ao olhar para o Dashboard.

---

## Acceptance Criteria (BDD)

### AC1 — Status "streaming"
```gherkin
When `state.status === "streaming"`
Then ponto verde pulsante e texto `● LIVE` em Cyan são exibidos
And contador `HH:MM:SS` incrementa em tempo real
```

### AC2 — Status "reconnecting"
```gherkin
When `state.status === "reconnecting"`
Then ponto amarelo piscante e texto `● RECONNECTING`
```

### AC3 — Status "idle" ou "offline"
```gherkin
When `state.status === "idle"` ou `"offline"`
Then ponto vermelho estático e texto `● OFFLINE`
```

### AC4 — Transições suaves
```gherkin
Then transições entre estados usam `ease-in-out` de 300ms sem flash visual
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Criar `src/components/streaming/LiveStatusCard.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { StreamStatus } from '@/types/shared'; // ou importar do state local

const STATUS_CONFIG = {
  streaming: { color: '#10B981', label: '● LIVE', pulse: true },
  reconnecting: { color: '#F59E0B', label: '● RECONNECTING', pulse: true },
  idle: { color: '#EF4444', label: '● OFFLINE', pulse: false },
  offline: { color: '#EF4444', label: '● OFFLINE', pulse: false },
  paused: { color: '#F59E0B', label: '● PAUSED', pulse: false },
  compliance_blocked: { color: '#EF4444', label: '● BLOCKED', pulse: false },
};

export function LiveStatusCard({ status }: { status: StreamStatus }) {
  const [uptime, setUptime] = useState(0); // segundos
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;

  useEffect(() => {
    if (status !== 'streaming') { setUptime(0); return; }
    const interval = setInterval(() => setUptime((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <div style={{ transition: 'all 300ms ease-in-out' }}>
      <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
      {status === 'streaming' && (
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-muted)', fontSize: '12px', marginTop: '4px' }}>
          {formatUptime(uptime)}
        </div>
      )}
    </div>
  );
}
```

### Animação de Pulsação

Adicionar keyframe no `globals.css`:
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.pulse { animation: pulse-dot 1.5s ease-in-out infinite; }
```

---

## Checklist de Implementação

- [ ] Criar `src/components/streaming/LiveStatusCard.tsx`
- [ ] Adicionar `@keyframes pulse-dot` no `globals.css`
- [ ] Integrar `LiveStatusCard` na `Sidebar` do Dashboard
- [ ] Verificar: ponto verde pulsante quando status = "streaming"
- [ ] Verificar: contador HH:MM:SS incrementando em tempo real
- [ ] Verificar: transições de estado sem flash

---

## Status

**Status:** ready-for-dev
