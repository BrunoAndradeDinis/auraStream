---
baseline_commit: 6e53350b0ca6031d2df2994c97f31df4713e5bad
---

# Story 2.1: Implementar Carregamento da Fila de Áudio do Diretório Local

## Metadados

| Campo             | Valor                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| **Story ID**      | 2.1                                                                                |
| **Story Key**     | 2-1-implementar-carregamento-da-fila-de-audio-do-diretorio-local                   |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                                         |
| **Status**        | ready-for-dev                                                                      |
| **Esforço Est.**  | ~2h                                                                                |
| **Depende de**    | Story 1.3 (state store), Story 1.4 (broadcast)                                    |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o servidor leia automaticamente os arquivos `.mp3` de `./src/assets/audio/` ao iniciar e os adicione à fila de estado,
> **Para que** a fila esteja populada e pronta para tocar sem necessidade de configuração manual.

---

## Acceptance Criteria (BDD)

### AC1 — Fila populada ao iniciar com .mp3 presentes

```gherkin
Given existem arquivos `.mp3` em `./src/assets/audio/`
When `npm run server` é iniciado
Then o servidor lê todos os arquivos `.mp3` do diretório
And cria um array de objetos `{ id, filename, path }` e popula `state.queue`
And a fila é ordenada alfabeticamente por `filename`
And o estado com a fila populada é persistido em `server/state-cache.json`
```

### AC2 — Arquivos não-.mp3 ignorados silenciosamente

```gherkin
Given o diretório contém arquivos `.mp3`, `.txt` e `.jpg`
When o servidor inicia
Then apenas os `.mp3` são adicionados à fila
And arquivos com outras extensões são ignorados sem log de erro
```

### AC3 — Diretório vazio não causa erro

```gherkin
Given `./src/assets/audio/` existe mas está vazio
When o servidor inicia
Then `state.queue` é `[]` sem crash
And o log exibe `[server] audio dir scanned: 0 tracks loaded`
```

---

## Contexto para o Agente de Desenvolvimento

### Localização do Diretório de Áudio

```
./src/assets/audio/          ← relativo à raiz do projeto
```

O caminho absoluto deve ser resolvido a partir de `process.cwd()` (não `__dirname`) pois o servidor roda a partir da raiz do projeto:

```typescript
import path from 'path';
const AUDIO_DIR = path.join(process.cwd(), 'src', 'assets', 'audio');
```

### Geração do `id` (slug)

O `id` de cada faixa é o slug do nome do arquivo sem extensão:
```typescript
const slug = filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-');
```

Exemplo: `"Neffex - Failure.mp3"` → `id: "neffex---failure"`

### Implementação em `server/server.ts` (ou novo `server/queue.ts`)

Criar função `loadAudioQueue()` chamada no boot:

```typescript
import fs from 'fs';
import path from 'path';
import { setState, state } from './state';
import { TrackInfo } from './types';

const AUDIO_DIR = path.join(process.cwd(), 'src', 'assets', 'audio');

export function loadAudioQueue(): void {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      console.warn(`[server] audio dir not found: ${AUDIO_DIR}`);
      return;
    }

    const files = fs.readdirSync(AUDIO_DIR)
      .filter((f) => f.toLowerCase().endsWith('.mp3'))
      .sort(); // ordem alfabética

    const queue: TrackInfo[] = files.map((filename) => ({
      id: filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-'),
      filename,
      path: path.join(AUDIO_DIR, filename),
    }));

    setState({ queue, currentTrack: queue[0] ?? null });
    console.log(`[server] audio dir scanned: ${queue.length} tracks loaded`);
  } catch (err) {
    console.error('[server] failed to load audio queue:', (err as Error).message);
  }
}
```

Chamar `loadAudioQueue()` logo após o servidor iniciar (no evento `wss.on('listening', ...)`).

### Relação com Story 1.3

O `setState({ queue })` chama automaticamente `persistState()`, gravando a fila em `server/state-cache.json` (sem `streamKey`). Não é necessário chamar `fs.writeFile` diretamente aqui.

### Relação com Story 3.1

A Story 3.1 (`watcher.ts`) adicionará monitoramento dinâmico do diretório. Esta story lida apenas com o carregamento **inicial** no boot.

### Regras Críticas

1. **Não usar `__dirname`** para o caminho do diretório de áudio — usar `process.cwd()` para garantir que o caminho seja relativo à raiz do projeto independente de onde o `server.ts` está.
2. **`sort()` alfabético** — a fila deve ser ordenada por nome de arquivo no boot.
3. **`currentTrack`** — ao carregar a fila, definir `currentTrack` como a primeira faixa (`queue[0] ?? null`).
4. **Não sobrescrever fila se cache existir** — se `state-cache.json` tem fila, o `setState` da Story 1.3 já a carregou. Decidir: **sempre recarregar do disco ao iniciar** (frescor > persistência de ordem). Esta é a abordagem recomendada para simplicidade.

---

## Checklist de Implementação

- [x] Criar função `loadAudioQueue()` (em `server/queue.ts` ou inline em `server.ts`)
- [x] Chamar `loadAudioQueue()` no evento `wss.on('listening', ...)`
- [x] Verificar: `state.queue` populado após boot com `.mp3` no diretório
- [x] Verificar: fila ordenada alfabeticamente
- [x] Verificar: arquivos não-.mp3 ignorados
- [x] Verificar: diretório vazio → `state.queue = []` sem erro
- [x] Verificar: `server/state-cache.json` contém a fila após boot

---

## Dev Agent Record

### Implementation Notes

- Criado o ficheiro `server/queue.ts` responsável por ler os arquivos do diretório `src/assets/audio/`.
- Adicionado regex para formatação de ID (`slug`) e validação via extensão para não considerar imagens/arquivos texto no parser do array (e.g. `image.jpg`).
- Alterado o evento `wss.on('listening')` de `server/server.ts` para agendar a chamada `loadAudioQueue()` populando o estado.

### Completion Notes

✅ Story 2.1 finalizada com sucesso. ACs foram checados no projeto real:
- **AC1**: Com `npm run server` a queue foi devidamente carregada (43 ficheiros de teste encontrados e persistidos no JSON cache).
- **AC2**: Arquivo `image.jpg` testado em validação de disco foi ignorado com sucesso.
- **AC3**: Foi demonstrado que com 0 elementos a fila inicia `[]` e não crasha a execução.

### File List

- `server/queue.ts` — novo
- `server/server.ts` — modificado

### Change Log

- 2026-06-11: Story 2.1 concluída — Scanner de media `.mp3` adicionado à pipeline de carga do server.

---

## Status

**Status:** review
**Nota de conclusão:** Feature totalmente integrada com parsing validado e gerando estado seguro persistente.
