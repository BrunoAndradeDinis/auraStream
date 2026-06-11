# Story 4.8: Implementar o Widget de Status de Compliance NCS

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 4.8                                                                    |
| **Story Key**     | 4-8-implementar-o-widget-de-status-de-compliance-ncs                   |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic           |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 4.2 (layout), Story 4.13 (WebSocket), Story 3.4 (validação NCS) |

---

## User Story

> **Como** Bruno,
> **Eu quero** um card de "Compliance Status" mostrando o estado geral da whitelist NCS,
> **Para que** eu saiba se alguma faixa está bloqueada antes de iniciar a live.

---

## Acceptance Criteria (BDD)

### AC1 — Todas as faixas verificadas
```gherkin
When todas as faixas da fila passam na validação NCS
Then card exibe `✅ All tracks verified` com borda e ícone em verde #10B981
```

### AC2 — Faixas com falha
```gherkin
When há faixas com falha
Then card exibe `⚠️ N tracks unverified` em amarelo com lista dos títulos faltantes
```

### AC3 — Compliance bloqueado
```gherkin
When `state.status === "compliance_blocked"`
Then card exibe `❌ BLOCKED: Non-NCS source detected` em vermelho com nome da faixa e link `Fix Now → compliance guide`
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Criar `src/components/streaming/ComplianceWidget.tsx`:

```tsx
'use client';
import { AppState } from '@/types/shared';

export function ComplianceWidget({ state }: { state: AppState }) {
  const isBlocked = state.status === 'compliance_blocked';
  const unverified = state.queue.filter((t) => !t.isVerified); // campo adicionado via state_sync

  if (isBlocked) {
    return (
      <div className="glass-card" style={{ border: '1px solid #EF4444', transition: 'all 300ms ease-in-out' }}>
        <span style={{ color: '#EF4444' }}>❌ BLOCKED: Non-NCS source detected</span>
        <a href="https://ncs.io" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>Fix Now →</a>
      </div>
    );
  }

  if (unverified.length > 0) {
    return (
      <div className="glass-card" style={{ border: '1px solid #F59E0B', transition: 'all 300ms ease-in-out' }}>
        <span style={{ color: '#F59E0B' }}>⚠️ {unverified.length} tracks unverified</span>
        <ul>
          {unverified.map((t) => <li key={t.id}>{t.filename}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ border: '1px solid #10B981', transition: 'all 300ms ease-in-out' }}>
      <span style={{ color: '#10B981' }}>✅ All tracks verified</span>
    </div>
  );
}
```

### Campo `isVerified` no TrackInfo

O servidor deve incluir `isVerified: boolean` em cada `TrackInfo` ao fazer broadcast. Adicionar em `server/types.ts`:
```typescript
export interface TrackInfo {
  // ... campos existentes
  isVerified?: boolean; // resultado de validateTrack no momento do carregamento
}
```

E popular ao carregar a fila na Story 2.1 (ou nesta story, como melhoria).

---

## Checklist de Implementação

- [x] Criar `ComplianceWidget.tsx`
- [x] Adicionar campo `isVerified` em `TrackInfo` e popular no servidor
- [x] Integrar widget na sidebar ou área central do Dashboard
- [x] Verificar: estados corretos para verified/unverified/blocked com transições 300ms

---

## Dev Agent Record

### Implementation Notes
- O tipo `TrackInfo` agora suporta tracking de verificação. O widget acusa estado amarelo quando encontra isVerified === false, servindo de gatekeeper visual no dashboard.
- Componente linkado no painel central para garantir máxima visibilidade durante as operações de stream.

### Completion Notes
✅ Story 4.8 concluída com as definições de tipagem frontend/backend alinhadas para a propriedade isVerified.

### Change Log
- 2026-06-11: Dashboard acusa faixas suspeitas/unverifieds utilizando NCS styling guides.

---

## Status

**Status:** review
