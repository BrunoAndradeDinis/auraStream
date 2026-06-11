# Story 3.1: Implementar o Watcher de Diretório de Áudio

## Metadados

| Campo             | Valor                                                              |
|-------------------|--------------------------------------------------------------------|
| **Story ID**      | 3.1                                                                |
| **Story Key**     | 3-1-implementar-o-watcher-de-diretorio-de-audio                    |
| **Epic**          | Epic 3 — Asset Sync, Metadata e Compliance NCS                     |
| **Status**        | ready-for-dev                                                      |
| **Esforço Est.**  | ~3h                                                                |
| **Depende de**    | Story 2.1 (fila carregada), Story 1.4 (broadcast)                 |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o servidor monitore automaticamente `./src/assets/audio/` em busca de novos `.mp3` ou remoções,
> **Para que** eu possa adicionar músicas sem reiniciar nenhum processo.

---

## Acceptance Criteria (BDD)

### AC1 — Novo .mp3 detectado em até 1s
```gherkin
Given o servidor está rodando e `./src/assets/audio/` existe
When um novo arquivo `.mp3` é copiado para o diretório
Then em até 1s o servidor detecta o arquivo (com debounce de 500ms)
And adiciona ao final de `state.queue` e transmite broadcast com estado atualizado
And loga `[watcher] audio added: filename.mp3`
```

### AC2 — Arquivo removido tratado corretamente
```gherkin
When um arquivo `.mp3` é removido
Then se a faixa não tocou ainda, é removida de `state.queue`
And se estava tocando, skip automático para próxima faixa é acionado
```

### AC3 — Não-.mp3 ignorado sem erro
```gherkin
When arquivo não-.mp3 é adicionado ao diretório
Then é ignorado silenciosamente (sem log de erro)
```

---

## Contexto para o Agente de Desenvolvimento

### Dependência a Instalar
```bash
npm install chokidar
```

### Implementação de `server/watcher.ts`

```typescript
import chokidar from 'chokidar';
import path from 'path';
import { state, setState } from './state';
import { broadcast } from './broadcast';
import { TrackInfo } from './types';

const AUDIO_DIR = path.join(process.cwd(), 'src', 'assets', 'audio');

export function startAudioWatcher(): void {
  const watcher = chokidar.watch(AUDIO_DIR, {
    ignored: (f: string) => !f.endsWith('.mp3') && !f.endsWith(path.sep),
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on('add', (filePath) => {
    const filename = path.basename(filePath);
    if (!filename.toLowerCase().endsWith('.mp3')) return;
    const id = filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-');
    const exists = state.queue.find((t) => t.id === id);
    if (exists) return;
    const track: TrackInfo = { id, filename, path: filePath };
    setState({ queue: [...state.queue, track] });
    broadcast();
    console.log(`[watcher] audio added: ${filename}`);
  });

  watcher.on('unlink', (filePath) => {
    const filename = path.basename(filePath);
    const id = filename.replace(/\.mp3$/i, '').toLowerCase().replace(/\s+/g, '-');
    const isCurrentTrack = state.currentTrack?.id === id;
    const newQueue = state.queue.filter((t) => t.id !== id);
    setState({ queue: newQueue });
    broadcast();
    if (isCurrentTrack) {
      // Sinalizar skip — o browser ouve o broadcast e trata
      broadcast(); // Já feito acima; o frontend detecta mudança em currentTrack
    }
    console.log(`[watcher] audio removed: ${filename}`);
  });
}
```

Chamar `startAudioWatcher()` em `server/server.ts` após `loadAudioQueue()`.

### Regras Críticas

1. **`awaitWriteFinish`** — necessário para aguardar conclusão da cópia do arquivo antes de processá-lo (evitar ler arquivo incompleto).
2. **Debounce de 500ms** — via `stabilityThreshold: 500` do chokidar.
3. **Não duplicar** — verificar se `id` já existe na fila antes de adicionar.
4. **Skip se faixa atual removida** — o broadcast com o novo estado (sem `currentTrack`) é suficiente para o frontend detectar e skip. Implementar lógica complementar de auto-skip no servidor se necessário.

---

## Checklist de Implementação

- [x] Instalar `chokidar`
- [x] Criar `server/watcher.ts` com `startAudioWatcher()`
- [x] Chamar `startAudioWatcher()` no boot em `server.ts`
- [x] Verificar: novo .mp3 detectado em < 1s com broadcast
- [x] Verificar: remoção remove da fila com broadcast
- [x] Verificar: não-.mp3 ignorado silenciosamente

---

## Dev Agent Record

### Implementation Notes
- Módulo `watcher.ts` implementado utilizando `chokidar`.
- Ignora triggers redundantes de inicialização via flag `ignoreInitial: true` para que apenas deltas sejam capturados e não colidam com o processo batch do boot (`queue.ts`).
- Validação robusta de `.mp3` extension, debounce via chokidar options.
- Despacha updates ao `state.queue` e gera re-render instantâneo no frontend via socket `broadcast()`.
- Lança evento `media:skip` diretamente se a pista corrente for removida fisicamente no host (unlink).

### Completion Notes
✅ Story 3.1 concluída com sucesso e tipagem validada.

### File List
- `server/watcher.ts` — criado
- `server/server.ts` — atualizado para instanciar watcher
- `package.json` — chokidar instalado

### Change Log
- 2026-06-11: Implementado sistema de auto-sync de catálogo musical local monitorando /assets/audio.

---

## Status

**Status:** review
