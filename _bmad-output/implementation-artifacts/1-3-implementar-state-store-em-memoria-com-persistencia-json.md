# Story 1.3: Implementar State Store em Memória com Persistência JSON

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 1.3                                                                            |
| **Story Key**     | 1-3-implementar-state-store-em-memoria-com-persistencia-json                   |
| **Epic**          | Epic 1 — Fundação do Servidor e Comunicação em Tempo Real                      |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~3h                                                                            |
| **Depende de**    | Story 1.2 (servidor WebSocket rodando)                                         |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o servidor mantenha um objeto de estado global em RAM e o persista em `server/state-cache.json` a cada mutação,
> **Para que** o sistema sobreviva a um restart e retome do último estado conhecido.

---

## Acceptance Criteria (BDD)

### AC1 — Criação do state-cache.json na primeira inicialização

```gherkin
Given o servidor inicia pela primeira vez sem `server/state-cache.json` existente
When `npm run server` é executado
Then o arquivo `server/state-cache.json` é criado automaticamente
And o conteúdo é `{ "queue": [], "currentTrack": null, "status": "idle" }`
And a `streamKey` NÃO está presente no JSON gerado
```

### AC2 — Carregamento do estado anterior no restart

```gherkin
Given `server/state-cache.json` existe com um estado não-vazio (ex: queue com 3 faixas)
When o servidor inicia
Then o estado anterior é carregado em memória como estado inicial
And os logs exibem `[server] state loaded from cache`
```

### AC3 — Função setState com merge e persistência

```gherkin
Given o servidor está rodando com estado em memória
When a função `setState(patch)` é chamada internamente com um patch parcial (ex: `{ status: "streaming" }`)
Then o patch é merged no estado atual (deep merge, não substituição total)
And o estado atualizado é serializado e gravado em `server/state-cache.json`
And a gravação é assíncrona (não bloqueia o event loop)
```

### AC4 — streamKey nunca gravada em disco

```gherkin
Given `state.streamKey` contém um valor em memória
When `setState` é chamada e o estado é persistido
Then o arquivo `server/state-cache.json` NÃO contém o campo `streamKey`
And o campo é excluído da serialização antes da gravação
```

---

## Contexto para o Agente de Desenvolvimento

### Estrutura do State em Memória

```typescript
// server/types.ts — criar este arquivo com as interfaces compartilhadas
export interface TrackInfo {
  id: string;        // slug normalizado do título
  filename: string;  // nome do arquivo .mp3
  path: string;      // caminho absoluto para o arquivo
  aiDescription?: string | null;
}

export type StreamStatus = 'idle' | 'streaming' | 'paused' | 'reconnecting' | 'offline' | 'compliance_blocked';

export interface AppState {
  queue: TrackInfo[];
  currentTrack: TrackInfo | null;
  status: StreamStatus;
  streamKey: string | null;  // NUNCA persistir em disco
  shutdownAt: number | null; // timestamp ms (Story 5.3)
}
```

### Implementação do State Store

Criar `server/state.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import { AppState } from './types';

const CACHE_PATH = path.join(__dirname, 'state-cache.json');

// Estado inicial padrão
const DEFAULT_STATE: AppState = {
  queue: [],
  currentTrack: null,
  status: 'idle',
  streamKey: null,
  shutdownAt: null,
};

// Carrega estado do disco ou usa padrão
function loadState(): AppState {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
      const persisted = JSON.parse(raw);
      console.log('[server] state loaded from cache');
      // streamKey nunca vem do disco — sempre inicia como null
      return { ...DEFAULT_STATE, ...persisted, streamKey: null };
    }
  } catch (err) {
    console.warn('[server] failed to load state cache, using defaults:', (err as Error).message);
  }
  return { ...DEFAULT_STATE };
}

// Estado global em memória
export let state: AppState = loadState();

// Persiste estado (sem streamKey) de forma assíncrona
function persistState(): void {
  const { streamKey, ...safeState } = state;  // exclui streamKey
  fs.writeFile(CACHE_PATH, JSON.stringify(safeState, null, 2), (err) => {
    if (err) console.error('[server] failed to persist state:', err.message);
  });
}

// Aplica patch parcial e persiste
export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  persistState();
}
```

### Integração com `server/server.ts`

No `server/server.ts` (Story 1.2), adicionar no topo:

```typescript
import { state, setState } from './state';
```

E ao iniciar, garantir que o `state-cache.json` é criado se não existir (já coberto pelo `loadState()`).

### Regras Críticas

1. **`streamKey` NUNCA vai para disco** — usar destructuring `const { streamKey, ...safeState } = state` antes de serializar.
2. **Writes assíncronos** — usar `fs.writeFile` (não `fs.writeFileSync`) para não bloquear o event loop do WebSocket.
3. **`shutdownAt` vai para o cache** — é um timestamp de agendamento que deve sobreviver a restarts (não é dado sensível).
4. **Criar `server/types.ts`** — as interfaces devem ser centralizadas aqui para que todas as stories subsequentes as importem em vez de redefinir.
5. **`state-cache.json` no `.gitignore`** — confirmar que `server/state-cache.json` está listado (adicionado na Story 1.1).

### Caminho do arquivo

`server/state-cache.json` fica dentro de `/server/` (relativo ao `__dirname` de `state.ts`). Não colocar na raiz do projeto.

---

## Checklist de Implementação

- [ ] Criar `server/types.ts` com interfaces `TrackInfo`, `StreamStatus`, `AppState`
- [ ] Criar `server/state.ts` com `state`, `setState`, lógica de load/persist
- [ ] Integrar import de `state`/`setState` no `server/server.ts`
- [ ] Verificar: primeira execução cria `server/state-cache.json` com estado padrão
- [ ] Verificar: `streamKey` ausente do JSON gravado
- [ ] Verificar: segunda execução carrega o cache e loga `[server] state loaded from cache`
- [ ] Confirmar `server/state-cache.json` no `.gitignore`

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
