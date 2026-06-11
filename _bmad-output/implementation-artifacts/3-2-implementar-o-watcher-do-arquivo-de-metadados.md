# Story 3.2: Implementar o Watcher do Arquivo de Metadados

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 3.2                                                                    |
| **Story Key**     | 3-2-implementar-o-watcher-do-arquivo-de-metadados                      |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                         |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~2h                                                                    |
| **Depende de**    | Story 3.1 (chokidar instalado e padrão definido)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o servidor monitore `./src/assets/details/` para detectar atualizações no arquivo `music details.txt`,
> **Para que** alterações nos metadados NCS sejam refletidas na whitelist de compliance sem restart.

---

## Acceptance Criteria (BDD)

### AC1 — Mudança no arquivo dispara re-parse em até 1s
```gherkin
Given o servidor está rodando com `music details.txt` carregado em memória
When o arquivo é modificado e salvo
Then em até 1s o watcher detecta a mudança e re-dispara o parser de metadados (Story 3.3)
And o servidor loga `[watcher] metadata file updated, re-parsing...`
And o cache de metadados em memória é atualizado atomicamente sem reiniciar o servidor ou desconectar clientes
```

---

## Contexto para o Agente de Desenvolvimento

### Arquivo Monitorado
```
./src/assets/details/music details.txt
```

### Implementação — Adicionar em `server/watcher.ts`

```typescript
import { parseMetadata } from './compliance';

const DETAILS_FILE = path.join(process.cwd(), 'src', 'assets', 'details', 'music details.txt');

export function startMetadataWatcher(): void {
  const watcher = chokidar.watch(DETAILS_FILE, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on('change', () => {
    console.log('[watcher] metadata file updated, re-parsing...');
    parseMetadata(); // re-popula o cache em memória da Story 3.3
  });
}
```

Chamar `startMetadataWatcher()` no boot em `server.ts`, após `startAudioWatcher()`.

### Regras Críticas

1. **`parseMetadata()` é importado de `server/compliance.ts`** (Story 3.3) — deve ser uma função pura que atualiza um cache de módulo interno.
2. **Atômico** — o cache de metadados deve ser substituído de uma vez (não atualizado parcialmente) para evitar race conditions.
3. **Não desconectar clientes** — o watcher não deve reiniciar o servidor nem fechar conexões WebSocket.

---

## Checklist de Implementação

- [ ] Adicionar `startMetadataWatcher()` em `server/watcher.ts`
- [ ] Chamar `startMetadataWatcher()` no boot
- [ ] Verificar: modificação do txt → log `[watcher] metadata file updated, re-parsing...`
- [ ] Verificar: cache em memória atualizado sem desconectar clientes

---

## Status

**Status:** ready-for-dev
