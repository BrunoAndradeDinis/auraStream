# Story 2.2: Criar a Página Compositora Next.js com Web Audio API

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 2.2                                                                            |
| **Story Key**     | 2-2-criar-a-pagina-compositora-nextjs-com-web-audio-api                        |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                                     |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~4h                                                                            |
| **Depende de**    | Story 1.5 (WebSocket sync), Story 2.1 (fila populada no servidor)             |

---

## User Story

> **Como** Bruno,
> **Eu quero** que a página principal do Next.js carregue e decodifique o primeiro arquivo de áudio da fila via Web Audio API,
> **Para que** o browser esteja pronto para reproduzir e capturar áudio quando o stream iniciar.

---

## Acceptance Criteria (BDD)

### AC1 — AudioContext criado e faixa carregada

```gherkin
Given a fila no estado do servidor tem pelo menos uma faixa e o browser carrega `localhost:9002`
When a página Next.js monta e recebe `server:state_sync` via WebSocket com a fila
Then o browser cria um `AudioContext` e carrega o arquivo da `currentTrack` via `fetch` + `decodeAudioData`
And o áudio começa a tocar automaticamente em loop quando o evento `media:play` é recebido
```

### AC2 — Erros de decodificação emitem evento ao servidor

```gherkin
Given o browser tenta decodificar uma faixa de áudio
When a decodificação falha (arquivo corrompido ou formato inválido)
Then o browser emite `{ "event": "player:error", "payload": "decode_failed" }` de volta ao servidor
And o servidor recebe o erro e processa (auto-skip será implementado na Story 3.5)
```

### AC3 — AudioContext criado apenas após gesto do usuário

```gherkin
Given a página carrega sem interação do usuário
When o browser carrega
Then o `AudioContext` NÃO é criado automaticamente (evitar políticas de autoplay)
And um botão "Click to enable audio" é exibido para o primeiro gesto
And após o clique, o `AudioContext` é criado e o áudio inicia quando `media:play` é recebido
```

---

## Contexto para o Agente de Desenvolvimento

### Arquivo a Modificar

`src/app/page.tsx` — página principal compositora (já existe no projeto).

> **Atenção:** O `page.tsx` atual pode ter conteúdo existente (AuroraBackground, etc.). Preservar componentes já implementados e adicionar a lógica de Web Audio API sem sobrescrever.

### Estrutura do Hook de Áudio

Criar `src/hooks/use-audio-engine.ts`:

```typescript
'use client';
import { useRef, useCallback } from 'react';

export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    ctxRef.current = new AudioContext();
    gainRef.current = ctxRef.current.createGain();
    gainRef.current.connect(ctxRef.current.destination);
  }, []);

  const loadAndPlay = useCallback(async (trackPath: string, onEnd: () => void) => {
    const ctx = ctxRef.current;
    if (!ctx || !gainRef.current) return;

    try {
      const response = await fetch(trackPath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      sourceRef.current?.stop();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainRef.current);
      source.loop = false;
      source.onended = onEnd;
      source.start(0);
      sourceRef.current = source;
    } catch {
      // Emitir player:error via WebSocket — ver hook useWebSocket
      throw new Error('decode_failed');
    }
  }, []);

  const pause = useCallback(() => ctxRef.current?.suspend(), []);
  const resume = useCallback(() => ctxRef.current?.resume(), []);
  const setVolume = useCallback((v: number) => {
    if (!gainRef.current || !ctxRef.current) return;
    gainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.1);
  }, []);

  return { init, loadAndPlay, pause, resume, setVolume };
}
```

### Hook de WebSocket para o Frontend

Criar `src/hooks/use-websocket.ts`:

```typescript
'use client';
import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:9003';

export function useWebSocket(onMessage: (event: string, payload: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);
        onMessage(event, payload);
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => console.warn('[ws] connection error');
    ws.onclose = () => console.warn('[ws] disconnected');

    return () => ws.close();
  }, [onMessage]);

  const send = useCallback((event: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  return { send };
}
```

### Regras Críticas

1. **`'use client'`** — todos os hooks de Web Audio API e WebSocket devem ter diretiva de client component.
2. **Política de Autoplay** — `AudioContext` só pode ser criado após gesto do usuário. Exibir um botão de ativação.
3. **Caminho de áudio** — os arquivos `.mp3` ficam em `./src/assets/audio/`. O Next.js serve arquivos de `./public/` via fetch. **Problema:** `src/assets/audio/` não é servido pelo Next.js automaticamente. Solução: o browser não acessa diretamente — o Puppeteer abre a página localmente com acesso ao filesystem, ou criar uma API route `/api/audio/[filename]` que lê e serve o arquivo.
4. **API Route para servir áudio** — criar `src/app/api/audio/[filename]/route.ts` que lê o arquivo de `src/assets/audio/[filename]` e retorna como stream com `Content-Type: audio/mpeg`.
5. **`next.config.ts`** — verificar se `output: 'export'` está ativo. Se sim, API routes dinâmicas não funcionam em build estático. Para **desenvolvimento** (Puppeteer em dev mode), API routes funcionam. Para produção, o Puppeteer usa o dev server.

---

## Checklist de Implementação

- [ ] Criar `src/hooks/use-audio-engine.ts`
- [ ] Criar `src/hooks/use-websocket.ts`
- [ ] Criar `src/app/api/audio/[filename]/route.ts` para servir arquivos .mp3
- [ ] Modificar `src/app/page.tsx` para integrar os hooks
- [ ] Adicionar botão "Click to enable audio" para inicialização do AudioContext
- [ ] Verificar: áudio toca ao receber `media:play` via WebSocket
- [ ] Verificar: erro de decodificação emite `player:error` ao servidor

---

## Status

**Status:** ready-for-dev
**Nota de conclusão:** Story criada com análise completa de contexto.
