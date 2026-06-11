# Story 3.3: Implementar o Parser de Metadados do `music details.txt`

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 3.3                                                                            |
| **Story Key**     | 3-3-implementar-o-parser-de-metadados-do-music-details-txt                     |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                                 |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~4h                                                                            |
| **Depende de**    | Story 1.3 (tipos definidos em server/types.ts)                                 |

---

## User Story

> **Como** Bruno,
> **Eu quero** que `server/compliance.ts` leia e parse o arquivo `./src/assets/details/music details.txt` em um dicionário indexado pelo slug da música,
> **Para que** o sistema possa validar qualquer faixa da fila de forma instantânea em memória.

---

## Acceptance Criteria (BDD)

### AC1 — Parse de blocos em Map de metadados
```gherkin
Given o arquivo `music details.txt` contém blocos separados por `---`
When a função `parseMetadata()` é chamada
Then cada bloco é transformado em `{ title, artist, source, downloadLink, watchLink }`
And o resultado é um `Map<string, TrackMetadata>` com chave = slug normalizado do título
And slugs: lowercase, espaços → hífens
```

### AC2 — Variações idiomáticas tratadas
```gherkin
When o bloco contém `Song:` ou `Música:` para identificar a música
And `Music provided by` ou `Música fornecida por` para licenciamento
And `Free Download/Stream:` ou `Download gratuito:` para link
And `Watch:` ou `Assista:` para vídeo
Then todos são parseados corretamente via regex flexível
```

### AC3 — Blocos malformados ignorados com warning
```gherkin
Given um bloco sem campo `Song`/`Música`
When `parseMetadata()` é chamada
Then o bloco é ignorado
And loga `[compliance] skipped malformed block at line N`
```

### AC4 — Performance
```gherkin
Given arquivo com 200+ blocos
When `parseMetadata()` é chamada
Then retorna em menos de 200ms
```

---

## Contexto para o Agente de Desenvolvimento

### Interface a Adicionar em `server/types.ts`
```typescript
export interface TrackMetadata {
  title: string;
  artist: string;
  source: string;
  downloadLink: string;
  watchLink: string;
}
```

### Implementação de `server/compliance.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { TrackMetadata } from './types';

const DETAILS_PATH = path.join(process.cwd(), 'src', 'assets', 'details', 'music details.txt');

// Cache em memória — substituído atomicamente a cada parseMetadata()
let metadataCache: Map<string, TrackMetadata> = new Map();

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, '-');
}

export function parseMetadata(): Map<string, TrackMetadata> {
  try {
    const content = fs.readFileSync(DETAILS_PATH, 'utf-8');
    const blocks = content.split(/^---$/m).map((b) => b.trim()).filter(Boolean);
    const result = new Map<string, TrackMetadata>();
    let lineOffset = 0;

    for (const block of blocks) {
      const titleMatch = block.match(/^(?:Song|M[úu]sica):\s*(.+)$/im);
      if (!titleMatch) {
        console.warn(`[compliance] skipped malformed block at line ~${lineOffset}`);
        lineOffset += block.split('\n').length + 1;
        continue;
      }

      const title = titleMatch[1].trim();
      const artistMatch = block.match(/^(?:Music provided by|M[úu]sica fornecida por)\s*(.+)$/im);
      const downloadMatch = block.match(/^(?:Free Download\/Stream:|Download(?:\/Streaming)? gratuito:)\s*(.+)$/im);
      const watchMatch = block.match(/^(?:Watch:|Assista:)\s*(.+)$/im);

      const metadata: TrackMetadata = {
        title,
        artist: artistMatch?.[1].trim() ?? 'Unknown',
        source: artistMatch?.[1].trim() ?? '',
        downloadLink: downloadMatch?.[1].trim() ?? '',
        watchLink: watchMatch?.[1].trim() ?? '',
      };

      result.set(slugify(title), metadata);
      lineOffset += block.split('\n').length + 1;
    }

    metadataCache = result; // substituição atômica
    console.log(`[compliance] parsed ${result.size} tracks from metadata file`);
    return result;
  } catch (err) {
    console.error('[compliance] failed to parse metadata:', (err as Error).message);
    return metadataCache; // retorna cache anterior em caso de erro
  }
}

export function getMetadataCache(): Map<string, TrackMetadata> {
  return metadataCache;
}
```

### Regras Críticas

1. **Regex case-insensitive (`/i`)** — os campos podem ter capitalização variada.
2. **Substituição atômica** — `metadataCache = result` (não limpar e repopular o Map existente).
3. **Chamar `parseMetadata()` no boot** do servidor e também no watcher da Story 3.2.
4. **`getMetadataCache()`** é chamado pelas Stories 3.4+ para lookup instantâneo.

---

## Checklist de Implementação

- [ ] Adicionar `TrackMetadata` em `server/types.ts`
- [ ] Criar `server/compliance.ts` com `parseMetadata()` e `getMetadataCache()`
- [ ] Chamar `parseMetadata()` no boot do servidor
- [ ] Verificar: parse de blocos em inglês e português
- [ ] Verificar: blocos malformados geram warning sem crash
- [ ] Verificar: 200+ blocos processados em < 200ms

---

## Status

**Status:** ready-for-dev
