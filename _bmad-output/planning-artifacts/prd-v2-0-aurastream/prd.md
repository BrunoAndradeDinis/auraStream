---
title: "AuraStream v2.0 — Evolução para Launch"
status: draft
created: "2026-06-06"
updated: "2026-06-06"
version: 2.0
scope: "Internal/Studio — YouTube Radio Channel Streaming"
owner: "Bruno Andrade Dinis"
---

# AuraStream v2.0 — Product Requirements Document

## 📍 Visão & Escopo

**AuraStream v2.0** evolui o MVP para uma solução de streaming **production-ready** para canal de rádio musical no YouTube, operado integralmente pelo Bruno a partir de VM Magalu Cloud.

A v2.0 completa três frentes críticas:
1. **Features Core em Falta**: Sequenciador de Áudio automatizado, Ponte RTMP/SRT integrada, Asset Sync
2. **UI/UX Elevation**: Dashboard de monitoramento pessoal + MiniPlayer cinematic no canto inferior direito
3. **Configuration Pragmática**: YouTube Stream Key manageable via UI (fallback `.env`)

**Resultado esperado**: Sistema 100% operacional, sem dependências externas, pronto para transmissão 24/7 YouTube.

---

## 🎯 Success Metrics

| Métrica | Target | Rationale |
|---------|--------|-----------|
| **Uptime** | 99% em testes de 8h+ | Streaming ao vivo exige confiabilidade |
| **Audio Sync** | ±50ms latência vídeo→áudio | Imperceptível ao viewer |
| **UI Responsiveness** | <100ms feedback do Dashboard | Operador precisa de controle fluido |
| **CLI Responsiveness** | <200ms feedback do menu terminal | CLI também precisa ser fluida |
| **Stream Quality** | 720p@30fps, 3Mbps YouTube bitrate | Balança qualidade × banda VM |
| **MiniPlayer Render** | 60fps, 0 jank | Cinematic feel depende disso |
| **Auto-Shutdown Precision** | ±5s do horário agendado | Confiabilidade da automação |
#### FR-1.1 — Sequenciador de Áudio Automatizado
**O que**: Sistema que lê áudios de `./src/assets/audio/` e reproduz em loop infinito com controles interativos.

**Detalhes**:
- **Input**: Qualquer áudio (MP3, WAV, FLAC, OGG suportados)
- **Behavior**:
  - Loop automático: próxima faixa ao fim da atual
  - Crossfade entre tracks (fade-out 500ms + fade-in 500ms)
  - Fila observável (próximas 3 tracks visíveis no Dashboard)
- **Controls** (Dashboard):
  - Play/Pause
  - Skip forward/back
  - Remove track da fila
  - Reorder via drag-drop
  - Volume slider (0-100%)
- **Tech Carrier**: Web Audio API + FFmpeg local pipe
- **Status**: ⏳ In Development

#### FR-1.2 — Ponte RTMP/SRT para YouTube
**O que**: Captura o render local (browser + canvas + áudio) e transmite ao YouTube via RTMP integrada.

**Detalhes**:
- **Input**: Stream key (UI field + `.env` fallback)
- **Output**: RTMP → YouTube (ou SRT como fallback)
- **Resolution**: 1920×1080 @ 30fps
- **Bitrate**: 3-5 Mbps (adaptive conforme rede)
- **Behavior**:
  - Inicializa ao carregar página (padrão) ou on-demand via botão
  - Reconnect automático se cair (5 tentativas, backoff exponencial)
  - Status visual: green (live) / yellow (reconnecting) / red (offline)
- **Config**:
  - Stream key: UI textfield + localStorage
  - FFmpeg path: auto-detect ou env var
  - Bitrate targets: env vars (defaults: 3500k)
- **Tech Carrier**: FFmpeg + streaming lib integrada
- **Status**: ⏳ In Development

#### FR-1.4 — Stream Control Operations (NEW)
**O que**: Controles para Pause, Continue, Stop, Restart da transmissão.

**Detalhes**:
- **Pause** (sem parar RTMP):
  - Áudio pausa
  - RTMP transmissão continua (MiniPlayer fica estático)
  - Use case: Bruno adiciona tracks novas à fila
  - Duration: até Bruno clicar Continue
- **Continue**:
  - Retoma áudio após pause
  - RTMP já estava rodando (sem glitch)
- **Stop**:
  - Para áudio
  - Fecha RTMP (desconecta YouTube)
  - Estado preservado em localStorage
- **Restart**:
  - Limpa estado (fila, logs, pause flag)
  - Reinicia do zero
- **Interfaces**: Dashboard buttons + CLI menu
- **Status**: ⏳ In Development

#### FR-1.3 — Asset Synchronization
**O que**: Monitor automático em `./src/assets/` para detectar adições/remoções sem restart.

**Detalhes**:
- **Watch Dirs**: `audio/`, `details/`, `video/`
- **Trigger**: Mudança detectada → UI atualiza fila audio + detail files
- **Behavior**:
  - Polling 2s (ou fs.watch + debounce 1s se disponível)
  - Novo áudio: append na fila
  - Removido: remove se ainda não tocou; pula se tocando agora
  - New detail file: atualiza metadata instantaneamente
  - New video: próximo loop do background
- **Feedback**: Toast "Audio added" / "Detail file updated"
- **Tech Carrier**: Node.js file watcher ou browser-side indexedDB + service worker
- **Status**: ⏳ In Development

---

### **Fase 2: UI/UX — Cinematico & Monitoring** 🎬

#### FR-2.1 — Dashboard de Monitoramento Pessoal
**O que**: Painel centralizado para Bruno controlar stream, fila, e configurações em tempo real.

**Visual**: Left sidebar (dark, high-tech) + central content area
**Sections**:
- **Live Status** (top-right): Green dot (live) | Yellow (reconnecting) | Red (offline) + uptime counter
- **Stream Config** (card):
  - YouTube Stream Key input (masked, salva em localStorage)
  - Bitrate slider (1500-8000 kbps, default 3500)
  - Resolution dropdown (1080p / 720p / 480p)
  - Copy URL shortcut
- **Audio Queue** (main area):
  - Agora tocando: cover art (se houver) | título | artista | gênero + 30s waveform visual
  - Próximas 3: stack de cards com drag-drop reorder
  - Controls: Play/Pause | Skip | Remove
- **Video Background** (card):
  - Video loop status (current video name)
  - Upload/select video button
  - Loop indicator
- **Logs** (bottom):
  - Últimas 5 ações (track change, stream reconnect, error)
  - Limpar logs button

**Interactions**: Real-time updates (WebSocket simulado ou polling 500ms)
**Accessibility**: Dark mode (default), high contrast text
**Performance**: <100ms feedback

#### FR-2.2 — MiniPlayer Display (Cinematic Overlay)
**O what**: Overlay fixo canto inferior direito, 99% display da faixa tocando.

**Visual**:
- **Position**: Bottom-right, 280px × 140px, 20px margin from edges
- **Background**: Semi-transparent black (rgba(20, 16, 17, 0.85)) com subtle blur backdrop
- **Border**: 1px Orchid (#D629AD) top edge only
- **Layout**:
  - Left: cover art (120px × 120px, rounded corners)
  - Right: text stack
    - Title (Space Grotesk, 14px bold, Crimson #EB2E4E)
    - Artist (Inter, 12px, muted-foreground)
    - Genre + Subgenre (Inter, 10px, accent)
    - AI-Generated Description (Inter, 9px, muted, italic, 2-line max)

**Data Source**:
- Filename + NoCopyrightSounds metadata → `./src/assets/details/{track-id}.json`
- Genre/Subgenre + Description: IA generativa (batch na hora, cache em `.json`)

**Animations**:
- Fade-in 300ms on track change
- Glow pulse (subtle, Orchid border) every 3s (live indicator)
- Slide-up 200ms on new track

**Interactivity**: None (pure display). Não clicável.

---

### **Fase 3: Configuration & Metadata** ⚙️

#### FR-3.1 — Metadata File Format (Unified)
**O what**: Um `.json` por track em `./src/assets/details/` com toda metadata centralizada.

**Schema**:
```json
{
  "id": "string (filename without ext)",
  "title": "string",
  "artist": "string",
  "genre": "string",
  "subgenre": "string",
  "duration": "number (seconds)",
  "source": "string (url or credits)",
  "aiDescription": "string (genkit-generated)",
  "tags": ["array", "of", "strings"]
}
```

**Example**: `/src/assets/details/ceres-tame-pull-me-down.json`
```json
{
  "id": "ceres-tame-pull-me-down",
  "title": "Pull Me Down",
  "artist": "CERES x TAME",
  "genre": "Electronic",
  "subgenre": "Synthwave",
  "duration": 302,
  "source": "NoCopyrightSounds | ncs.io/c_pullmedown",
  "aiDescription": "Pulsing synth-driven journey through neon-lit corridors, layered with ethereal arpeggios and hypnotic bass.",
  "tags": ["ncs", "royalty-free", "upbeat"]
}
```

**Generation**:
- On first load of a new audio file (no `.json` → trigger IA, save result, cache)
- Batch regeneration via Dashboard button (useful if tweaking IA prompt)

#### FR-2.3 — Terminal CLI Interface (NEW)
**O what**: Menu interativo via terminal para operação sem GUI (crítico pra VM sem desktop).

**Detalhes**:
- **Entrypoint**: `npm run cli` ou `node src/cli/index.ts`
- **Menu Principal**: Interativo (via inquirer.js)
  - Start streaming
  - Pause (sem parar RTMP)
  - Continue
  - Stop streaming
  - Skip to next track
  - View current queue
  - Configure stream key
  - Set auto-shutdown timer (1h, 2h, 3h, 1d, 2d, 3d, 1w, 2w, 3w)
  - View logs (últimas 10)
  - Exit
- **Styling**: Chalk pra cores (Crimson headers, muted text)
- **Real-time Feedback**: <200ms entre input + resposta
- **Sync com Browser**: Compartilha estado via `src/store/` (file-based ou Redis)
- **Status**: ⏳ In Development

---

### **Fase 4: Automação & Timers** ⏲️

#### FR-4.1 — Auto-Shutdown Timers (OPTIONAL)
**O what**: Encerrar transmissão automaticamente após duração pré-definida.

**Detalhes**:
- **Presets**: 1h, 2h, 3h, 1d, 2d, 3d, 1w, 2w, 3w
- **Setup**: CLI menu ou Dashboard field
- **Display**: Timer visível em ambas as interfaces (countdown)
- **Aviso**: Toast + optional audio tone 5min antes do shutdown
- **Shutdown Sequence**:
  1. Pause áudio
  2. Wait 5s
  3. Stop RTMP (graceful close)
  4. Log "Scheduled shutdown at HH:MM"
  5. System idle (pode reiniciar manualmente)
- **Cancelável**: Botão "Cancel Timer" em qualquer hora
- **Precision**: ±5s do tempo agendado
- **Tech Carrier**: Node.js `setInterval` + millisecond-precision timestamp
- **Status**: ⏳ In Development (OPTIONAL — pode ser v2.1 se needed)

---

### **Fase 3: Configuration & Metadata** ⚙️

#### FR-3.2 — YouTube Stream Key Management
**O what**: Interface segura para armazenar e usar stream key sem hardcode.

**Behavior**:
- **Priority Order**:
  1. UI input (localStorage) — persists across sessions
  2. `.env` `YOUTUBE_STREAM_KEY` — fallback seguro
  3. Vazio → toast "Stream key missing" + block transmit button
- **Security**:
  - Masked input (dots ao digitar)
  - Não expõe em logs ou console
  - localStorage segura (não importa se alguém acessa a VM, a key fica encriptada)
- **UX**:
  - Campo no Dashboard
  - "Clear & use .env" button
  - "Generate test key" button (mock, pra testar without real YouTube)

---

## 🎬 User Journey — "Uma Sessão de Transmissão"

**Actor**: Bruno (operador/creator)

**Scenario**: Bruno liga a VM, inicia AuraStream via CLI, transmite 2h ao YouTube, depois para.

### **Path 1: CLI (Sem GUI, Common)**
1. **Setup (30s)**
   ```bash
   ssh [vm@magalu]
   npm run cli
   # Menu appears
   > Select: "Start streaming"
   > Set auto-shutdown: "2 hours"
   > Enter YouTube key (ou usa .env)
   ```
   - Sistema conecta RTMP → YouTube
   - Timer começa (2h countdown)

2. **Transmissão (2h)**
   - Áudios rodam em loop automático
   - Bruno quer adicionar tracks:
     ```bash
     npm run cli
     # Separate terminal
     > Select: "Pause"
     # Áudio pausa, RTMP segue transmitindo
     # Bruno copia novos áudios pra ./src/assets/audio/
     # Asset Sync detecta, fila atualiza
     npm run cli
     > Select: "Continue"
     # Áudio retoma
     ```
   - MiniPlayer no YouTube: track atual, artista, descrição IA, background video

3. **Close**
   - Timer atinge 0 → Auto-shutdown
   - Sistema: para áudio → fecha RTMP → logs "Scheduled shutdown"
   - Ou: `npm run cli` → "Stop streaming" manual

### **Path 2: Dashboard (Com GUI)**
1. **Setup** → Abre browser, Dashboard carrega, clica "Go Live"
2. **Transmissão** → Botões no Dashboard (Play/Pause/Continue/Stop)
3. **Close** → Clica "Stop Streaming" ou timer auto-encerra

**Key Decision**: CLI é primary (VM context), Dashboard é secondary (optional GUI access)

---

## ⚙️ Decisões de Design & Constraints

### **Scope Excluído (Deliberadamente)**
- ❌ Playlist saving/presets (v2.1 maybe)
- ❌ Chat integration YouTube
- ❌ Multi-stream (YouTube + Twitch, etc) — RTMP só YouTube v2.0
- ❌ Audio effects (EQ, reverb) — fora de scope
- ❌ User accounts/auth (single-operator tool)
- ⚠️ Auto-shutdown timers (optional — FR-4.1, pode ser v2.1 se não completar)

### **Tech Constraints**
- **FFmpeg Integration**: Deve rodar **no browser** (via wasm ou Node.js child process na VM) — **zero dependências externas** no operador
- **Video File Formats**: Assume MP4/WebM; fallback a placeholder se formato inválido
- **Crossfade**: Implementar via Web Audio API (não FFmpeg) para responsiveness

### **Compliance & Safety**
- Stream key **nunca** logado ou exposto em erro messages
- Graceful degradation: se IA estiver down, fallback a metadata JSON simples
- Reconnect limits (5 tentativas) para não sobrecarregar YouTube API

---

## 📈 Metrics & Observability

### **What We Measure**
| O quê | Como | Alvo |
|-------|------|------|
| Stream uptime | Contador no Dashboard | 99% |
| Track transitions | Time to next track | <1s (pause) + fade |
| IA latency | Timer na geração description | <2s |
| UI responsiveness | DevTools perf | <100ms |
| File watch latency | Delta time (file change → UI update) | <3s |

### **Logs & Debugging**
- Dashboard "Logs" tab: últimas 20 ações + erros
- localStorage console para histórico offline
- Dev mode: flags `DEBUG=aurastream:*` para verbose logging

---

## 🚀 Fases & Rollout

### **Sprint 1: Core Audio** (Week 1-2)
- [ ] Sequenciador: load, loop, crossfade (FR-1.1)
- [ ] Stream controls: Play/Pause/Continue/Stop/Restart (FR-1.4)
- [ ] Web Audio API integration
- [ ] Test com 10+ áudios

### **Sprint 2: CLI + Transmissão** (Week 2-3)
- [ ] Terminal CLI interface com menu (FR-2.3)
- [ ] FFmpeg + RTMP bridge (FR-1.2)
- [ ] YouTube key management (FR-3.2)
- [ ] Live stream test (manual + automated)
- [ ] CLI ↔ Browser state sync

### **Sprint 3: Asset Sync + Metadata** (Week 3)
- [ ] Asset watcher (FR-1.3)
- [ ] Metadata JSON schema (FR-3.1)
- [ ] IA batch generation (primeira load)

### **Sprint 4: UI Elevation** (Week 4)
- [ ] Dashboard redesign (FR-2.1)
- [ ] MiniPlayer cinematic overlay (FR-2.2)
- [ ] Polish & animations

### **Sprint 4.5: Auto-Shutdown (OPTIONAL)** (Week 4 end)
- [ ] Auto-shutdown timers (FR-4.1)
- [ ] CLI + Dashboard presets
- [ ] Aviso 5min antes + sequence

### **Sprint 5: Integration & Polish** (Week 5)
- [ ] End-to-end testing (8h+ session com CLI)
- [ ] Perf optimization (especialmente CLI latency)
- [ ] Docs (CLI commands, deployment guide)
- [ ] Deploy + launch

**Target Launch**: ~5 semanas se focused

---

## 🔗 Dependências & Bloqueadores

### **External**
- ✅ VM Magalu Cloud (já disponível)
- ✅ YouTube account + Studio (já setup)
- ✅ Google Genkit (já integrado na v1)

### **Internal**
- FFmpeg wasm build (bloqueador Sprint 2) — ou use Node.js child process se VM permite
- Design mockups MiniPlayer (bloqueador Sprint 4, mas pode usar defaults Crimson/Orchid)

---

## 📝 Open Questions & Assumptions

### **[ASSUMPTION]** Video Background Loop
- Assumindo video em `./src/assets/video/` é único (um arquivo) e loopa infinito
- Se multi-video, asset sync rotaciona? → **Clarify com Bruno**

### **[ASSUMPTION]** IA Description Batching
- Assumindo IA pode batch gerar descriptions para 50+ tracks em <30s
- Se slowww, fazer async background job? → **Clarify latency tolerance**

### **[ASSUMPTION]** Stream Key Persistence
- localStorage é seguro o suficiente pra Bruno?
- Se não, integrar com password manager da VM? → **Clarify security model**

### **[ASSUMPTION]** Uptime Definition
- "99% uptime" = stream conectado? ou sistema UI responsivo?
- Ou ambos? → **Clarify SLA boundaries**

---

## ✨ Próximos Passos

1. ✅ **Review este PRD** com Bruno — valida assumptions, clarifica open questions
2. **Cria Architecture Document** (`bmad-create-architecture`) — FFmpeg stack, WebSocket/polling strategy, state management
3. **Cria Epics & Stories** (`bmad-create-epics-and-stories`) — quebra em tasks executáveis
4. **UX Mockups** (opcional — pode codar + iterate se visual inspiração vem durante dev)
5. **Dev Execution** (`bmad-dev-story`) — Sprint 1 Audio Sequencer

---

## 📎 Referências

- **v1.0 Blueprint**: `docs/blueprint.md`
- **Tech Stack**: `doc.md` (seção Stack de Tecnologia)
- **Genkit Docs**: https://genkit.dev
- **FFmpeg**: https://ffmpeg.org/documentation.html
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

**Status**: Draft → Awaiting review & decision-log
**Owner**: Bruno Andrade Dinis
**Date**: 2026-06-06
