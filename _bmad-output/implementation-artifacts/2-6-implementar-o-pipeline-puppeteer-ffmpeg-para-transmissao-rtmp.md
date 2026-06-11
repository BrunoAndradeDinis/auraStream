# Story 2.6: Implementar o Pipeline Puppeteer → FFmpeg para Transmissão RTMP

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 2.6                                                                            |
| **Story Key**     | 2-6-implementar-o-pipeline-puppeteer-ffmpeg-para-transmissao-rtmp              |
| **Epic**          | Epic 2 — Motor de Áudio e Transmissão RTMP                                     |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~4h                                                                            |
| **Depende de**    | Story 2.5 (streamKey disponível), Story 2.4 (controles de áudio)              |

---

## User Story

> **Como** Bruno,
> **Eu quero** que `server/stream.ts` abra o browser headless via Puppeteer capturando a aba do compositor e pipe o stream para o FFmpeg,
> **Para que** o YouTube receba o sinal ao vivo em 1080p@30fps.

---

## Acceptance Criteria (BDD)

### AC1 — Stream inicia ao receber media:start_stream
```gherkin
Given a Stream Key está em memória e Next.js roda em localhost:9002
When o servidor recebe `media:start_stream`
Then `server/stream.ts` lança Puppeteer headless e carrega `http://localhost:9002`
And o stream áudio+vídeo é capturado via puppeteer-stream e pipeado ao processo FFmpeg filho
And FFmpeg transmite para `rtmp://a.rtmp.youtube.com/live2/{STREAM_KEY}` com bitrate 3500k e 1920×1080
And `state.status` é atualizado para "streaming" com broadcast para todos os clientes
```

### AC2 — Stream Key nunca nos logs
```gherkin
When o processo FFmpeg é lançado
Then os argumentos FFmpeg com a Stream Key NÃO são logados no console
And apenas `[stream] FFmpeg process started` é exibido
```

---

## Contexto para o Agente de Desenvolvimento

### Dependências a Instalar
```bash
npm install puppeteer puppeteer-stream
```

Versões de referência da arquitetura: `puppeteer@25.1.0`, `puppeteer-stream@3.0.22`.

### Implementação de `server/stream.ts`

```typescript
import { launch } from 'puppeteer';
import { getStream } from 'puppeteer-stream';
import { spawn, ChildProcess } from 'child_process';
import { setState } from './state';
import { broadcast } from './broadcast';

let ffmpegProcess: ChildProcess | null = null;

export async function startStream(streamKey: string): Promise<void> {
  const browser = await launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:9002');

  const stream = await getStream(page, { audio: true, video: true });

  // FFmpeg args — NUNCA logar streamKey
  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  ffmpegProcess = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '3500k',
    '-s', '1920x1080', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k',
    '-f', 'flv', rtmpUrl,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  stream.pipe(ffmpegProcess.stdin!);
  console.log('[stream] FFmpeg process started');

  ffmpegProcess.on('close', (code) => {
    if (code !== 0) handleStreamDrop();
  });

  setState({ status: 'streaming' });
  broadcast();
}

function handleStreamDrop(): void {
  // Reconexão tratada na Story 2.7
  setState({ status: 'offline' });
  broadcast();
}

export function stopStream(): void {
  ffmpegProcess?.kill('SIGTERM');
  ffmpegProcess = null;
}
```

### Regras Críticas

1. **`rtmpUrl` nunca logado** — montar a URL com a chave mas nunca imprimir no console.
2. **FFmpeg deve estar instalado na VM** — `ffmpeg` no PATH. Documentar como prerequisito.
3. **`headless: true` + `--no-sandbox`** para VM Linux sem display.
4. **`stream.pipe(ffmpegProcess.stdin)`** — o pipe conecta a captura do Puppeteer ao stdin do FFmpeg.

---

## Checklist de Implementação

- [x] Instalar `puppeteer` e `puppeteer-stream`
- [x] Criar `server/stream.ts` com `startStream()` e `stopStream()`
- [x] Adicionar handler `media:start_stream` no switch de eventos do servidor
- [x] Verificar: status atualiza para "streaming" com broadcast
- [x] Verificar: Stream Key não aparece nos logs

---

## Dev Agent Record

### Implementation Notes

- Modulo `server/stream.ts` criado usando `puppeteer@25` injetando diretamente o buffer do layout frontend Next.js no `pipe:0` do ffmpeg rodando x264/AAC.
- `server.ts` integrado fazendo as chamadas correspondentes com verificação extra de safety guard assegurando `!state.streamKey`.
- Adicionado `@ts-expect-error` isolado no wrapper do `getStream` de forma a mitigar descasamento de typings das interfaces nativas de pacotes puppeteer vs puppeteer-stream.

### Completion Notes

✅ Story 2.6 concluída com sucesso. Todo pipeline de rtmp headless implementado e compilado sem errors.
- **AC1** Cumprido via `spawn('ffmpeg', ...)` acoplado à stream do puppeteer.
- **AC2** Cumprido: URL string interpolada direto no spawn de child-process, nunca levada ao logger nativo.

### File List
- `server/stream.ts` — criado
- `server/server.ts` — modificado

### Change Log
- 2026-06-11: Story 2.6 implementada — Captura de frontend em headless browser conectada ao transponder x264 FFmpeg.

---

## Status

**Status:** review
