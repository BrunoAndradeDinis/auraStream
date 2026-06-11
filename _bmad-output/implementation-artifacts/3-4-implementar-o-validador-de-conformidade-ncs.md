# Story 3.4: Implementar o Validador de Conformidade NCS

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 3.4                                                                    |
| **Story Key**     | 3-4-implementar-o-validador-de-conformidade-ncs                        |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                         |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 3.3 (parser de metadados)                                        |

---

## User Story

> **Como** Bruno,
> **Eu quero** que `server/compliance.ts` exponha uma função `validateTrack(trackId)` que verifica se uma faixa está na whitelist parseada,
> **Para que** somente faixas certificadas NCS sejam permitidas na transmissão.

---

## Acceptance Criteria (BDD)

### AC1 — Faixa presente na whitelist
```gherkin
Given o cache de metadados está populado
When `validateTrack("nome-da-musica")` é chamada para faixa presente
Then retorna `{ valid: true, metadata: { title, artist, source } }`
```

### AC2 — Faixa ausente da whitelist
```gherkin
When `validateTrack("musica-desconhecida")` é chamada para faixa ausente
Then retorna `{ valid: false, reason: "not_in_whitelist" }`
```

### AC3 — Performance e pureza
```gherkin
When `validateTrack()` é chamada
Then retorna em menos de 5ms (Map lookup, sem I/O)
And a função é pura e não causa efeitos colaterais
```

---

## Contexto para o Agente de Desenvolvimento

### Interface a Adicionar em `server/types.ts`
```typescript
export type ValidationResult =
  | { valid: true; metadata: TrackMetadata }
  | { valid: false; reason: 'not_in_whitelist' };
```

### Implementação — Adicionar em `server/compliance.ts`

```typescript
import { ValidationResult } from './types';

export function validateTrack(trackId: string): ValidationResult {
  const cache = getMetadataCache();
  const metadata = cache.get(trackId);
  if (metadata) {
    return { valid: true, metadata };
  }
  return { valid: false, reason: 'not_in_whitelist' };
}
```

> **Nota:** O `trackId` é o slug gerado na Story 2.1 — mesmo algoritmo de slugify. Garantir consistência: `filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-')`.

### Regras Críticas

1. **Map lookup O(1)** — `cache.get(trackId)` é instantâneo, sem iteração.
2. **Sem I/O** — `validateTrack` apenas consulta o cache em memória. Nenhuma leitura de arquivo.
3. **Função pura** — sem side effects, sem logging interno. O logging é responsabilidade de quem chama (Stories 3.5 e 3.6).

---

## Checklist de Implementação

- [ ] Adicionar `ValidationResult` em `server/types.ts`
- [ ] Implementar `validateTrack()` em `server/compliance.ts`
- [ ] Verificar: `validateTrack("slug-existente")` retorna `{ valid: true, metadata: {...} }`
- [ ] Verificar: `validateTrack("nao-existe")` retorna `{ valid: false, reason: "not_in_whitelist" }`
- [ ] Verificar: execução em < 5ms

---

## Status

**Status:** ready-for-dev
