# Story 3.6: Implementar o Audit Logger de Conformidade NCS

## Metadados

| Campo             | Valor                                                              |
|-------------------|--------------------------------------------------------------------|
| **Story ID**      | 3.6                                                                |
| **Story Key**     | 3-6-implementar-o-audit-logger-de-conformidade-ncs                 |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                     |
| **Status**        | ready-for-dev                                                      |
| **Esforço Est.**  | ~2h                                                                |
| **Depende de**    | Story 3.4 (validateTrack)                                          |

---

## User Story

> **Como** Bruno,
> **Eu quero** que cada decisão de conformidade seja registrada em `./logs/compliance-audit.jsonl`,
> **Para que** eu tenha trilha de auditoria defensável caso o canal receba um strike do YouTube.

---

## Acceptance Criteria (BDD)

### AC1 — Faixa aprovada logada como INFO
```gherkin
When uma faixa é aprovada (`valid === true`)
Then appenda linha JSON: `{"timestamp":"ISO8601","level":"INFO","event":"track_play","trackId":"slug","status":"APPROVED","source":"ncs.io/..."}`
```

### AC2 — Faixa rejeitada logada como WARNING
```gherkin
When uma faixa é rejeitada (`valid === false`)
Then appenda linha JSON: `{"timestamp":"ISO8601","level":"WARNING","event":"compliance_skip","trackId":"slug","status":"REJECTED","reason":"not_in_whitelist"}`
```

### AC3 — Arquivo append-only e sobrevive a restarts
```gherkin
Then o arquivo é aberto em modo `a` (append)
And cada linha é um JSON válido e independente (formato JSONLines)
And o arquivo sobrevive a múltiplos restarts sem perder dados anteriores
```

---

## Contexto para o Agente de Desenvolvimento

### Localização
```
./logs/compliance-audit.jsonl    ← raiz do projeto
```

O diretório `./logs/` deve ser criado automaticamente se não existir.

### Implementação — Adicionar em `server/compliance.ts`

```typescript
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'compliance-audit.jsonl');

export function auditLog(
  level: 'INFO' | 'WARNING' | 'ERROR',
  event: string,
  trackId: string,
  status: 'APPROVED' | 'REJECTED',
  details: string
): void {
  // Criar diretório se não existir
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    trackId,
    status,
    details,
  });

  fs.appendFile(LOG_FILE, entry + '\n', (err) => {
    if (err) console.error('[compliance] failed to write audit log:', err.message);
  });
}
```

### Regras Críticas

1. **`fs.appendFile` (assíncrono)** — não bloquear o event loop.
2. **`recursive: true` no mkdirSync** — criar `/logs/` e qualquer subdiretório necessário.
3. **Uma linha por entrada** — formato JSONLines (JSONL), não um array JSON.
4. **`logs/compliance-audit.jsonl` no `.gitignore`** — confirmar que foi adicionado na Story 1.1.
5. **`auditLog` exportado** para uso nas Stories 3.5 e 5.4.

---

## Checklist de Implementação

- [x] Implementar `auditLog()` em `server/compliance.ts`
- [x] Verificar: `./logs/` criado automaticamente se ausente
- [x] Verificar: aprovações geram linha INFO com status APPROVED
- [x] Verificar: rejeições geram linha WARNING com status REJECTED
- [x] Verificar: arquivo cresce com appends sucessivos (não sobrescreve)

---

## Dev Agent Record

### Implementation Notes
- `auditLog` é não-bloqueante (async callback via fs.appendFile).
- Estrutura JSONL facilita queries e parses robustos (linhas separadas por \n).
- Criada a function que gera o folder `/logs` com flag recursive para evitar problemas em fresh clones.

### Completion Notes
✅ Story 3.6 (e como dependência da 3.5) completada simultaneamente.

### File List
- `server/compliance.ts` — modificado

### Change Log
- 2026-06-11: Audit Trail e persistência logging pro compliance NCS.

---

## Status

**Status:** review
