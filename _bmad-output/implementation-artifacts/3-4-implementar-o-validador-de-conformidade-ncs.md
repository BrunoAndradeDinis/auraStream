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

- [x] Adicionar `ValidationResult` em `server/types.ts`
- [x] Implementar `validateTrack()` em `server/compliance.ts`
- [x] Verificar: `validateTrack("slug-existente")` retorna `{ valid: true, metadata: {...} }`
- [x] Verificar: `validateTrack("nao-existe")` retorna `{ valid: false, reason: "not_in_whitelist" }`
- [x] Verificar: execução em < 5ms

---

## Dev Agent Record

### Implementation Notes
- O tipo `ValidationResult` foi criado com abordagem de tipagem de união discriminada (discriminated union) `valid: boolean` para Typescript inferir magicamente os tipos corretos em caso de sucesso ou insucesso.
- `validateTrack` construído com O(1) de acesso pegando do Map global no `compliance.ts` assegurando um threshold puramente in-memory, zero overhead em I/O.

### Completion Notes
✅ Story 3.4 completa. Validador pronto pra uso por triggers do Player.

### File List
- `server/compliance.ts` — modificado
- `server/types.ts` — modificado

### Change Log
- 2026-06-11: Implementado verificador O(1) in-memory de whitelists NCS.

---

## Status

**Status:** review
