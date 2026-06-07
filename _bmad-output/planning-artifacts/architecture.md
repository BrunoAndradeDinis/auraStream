---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd-v2-0-aurastream/prd.md
  - docs/blueprint.md
workflowType: 'architecture'
project_name: 'project aura'
user_name: 'bruno'
date: '2026-06-07'
lastStep: 8
status: 'complete'
completedAt: '2026-06-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **Sequenciador de Áudio Automatizado (FR-1.1 & FR-1.4)**: Leitura de arquivos locais (`./src/assets/audio/`), loop contínuo com crossfade suave de 500ms operado via Web Audio API. Suporte a controles tradicionais de mídia (Play, Pause, Skip, reordenação de fila).
- **Transmissão RTMP/SRT integrada (FR-1.2 & FR-3.2)**: Captação da renderização (página local/Canvas) e do áudio e transmissão via FFmpeg para o YouTube. Gerenciamento seguro de Stream Key via input mascarado na UI (salvo em localStorage) ou fallback para variáveis de ambiente.
- **Asset Synchronization (FR-1.3)**: Observador de diretórios (`audio/`, `details/`, `video/`) com polling de 2s ou `fs.watch` com debounce de 1s para atualizações na fila em tempo real, sem necessidade de reiniciar a aplicação.
- **Interfaces do Operador (FR-2.1, FR-2.2 & FR-2.3)**:
  - **Dashboard de Monitoramento**: Painel Web de controle, exibição de status da live, controle de fila e logs.
  - **MiniPlayer Display (Cinematic Overlay)**: Camada visual sobre a transmissão (280x140px, Space Grotesk/Inter, Orchid glow pulse animado a cada 3s) exibindo a metadata da faixa e descrição gerada por IA.
  - **Terminal CLI Interface (FR-2.3)**: Interface interativa via console para operação headless na VM da Magalu Cloud.
- **Compliance & Audit (FR-5.0)**: Módulo de validação pré-stream e em tempo real das fontes de áudio contra a whitelist da NCS (NoCopyrightSounds) para evitar strikes do YouTube. Geração de relatórios de auditoria persistentes (`./logs/compliance-audit.jsonl`).
- **Auto-Shutdown Timers (FR-4.1)**: Timer de auto-desligamento com presets de 1h a 3w, contagem regressiva e aviso sonoro/visual 5min antes da desconexão controlada.

**Non-Functional Requirements:**
- **Sincronização de Áudio/Vídeo**: Limite de latência estrita de ±50ms para evitar dessincronização perceptível aos espectadores.
- **Performance de Renderização**: MiniPlayer em 60fps estáveis (0 jank) e animações fluidas para o efeito de Aurora Boreal (Canvas).
- **Tempo de Resposta de Interface**: Latência de feedbacks da UI do Dashboard < 100ms e da CLI < 200ms.
- **Resiliência e Confiabilidade**: Uptime mínimo de 99% em transmissões ininterruptas de 8h+; política de reconexão automática com backoff exponencial limitada a 5 tentativas.
- **Segurança de Dados**: Ocultação estrita da Stream Key, sem vazamento em logs de execução.

**Scale & Complexity:**
A arquitetura se enquadra na categoria de **Média-Alta Complexidade** devido ao controle em tempo real de fluxos de áudio e vídeo, a execução híbrida (headless via terminal VM Magalu Cloud vs browser/canvas rendering) e a necessidade de sincronizar perfeitamente o estado de reprodução e transmissão entre a CLI e a UI do navegador.

- Primary domain: Full-Stack / Media & Streaming
- Complexity level: Medium-High
- Estimated architectural components: 6 principais (Audio Sequencer Engine, FFmpeg/RTMP Bridge, State Management Store, Asset Watcher Service, Web Dashboard & Overlay UI, Terminal CLI Application)

### Technical Constraints & Dependencies
- **Execução na VM Magalu Cloud**: O ambiente operacional principal é uma máquina virtual Linux sem interface gráfica instalada.
- **FFmpeg Stack**: A transmissão de vídeo depende da presença de FFmpeg na VM (através de execução via child process do Node.js) ou do carregamento do FFmpeg no navegador (WASM). Como o controle CLI é headless, o processamento de vídeo final/streaming se beneficiará da arquitetura em nível de servidor.
- **Geração de Descrições via IA**: Dependência do Google Genkit para a criação de resumos rítmicos das músicas. Exige mecanismos de cache locais em JSON para contornar latência ou indisponibilidade da API de IA.
- **Crossfade Suave**: Exige a utilização de Web Audio API para controle de ganho dinâmico preciso e instantâneo no browser.

### Cross-Cutting Concerns Identified
- **Sincronização de Estado Unificado**: O maior desafio arquitetural é garantir que ações na CLI (ex: pular música, pausar áudio) sejam refletidas instantaneamente no render do browser (que gera o sinal de vídeo para o FFmpeg) e vice-versa, compartilhando a mesma fila de reprodução de maneira consistente (ex: via arquivo local compartilhado ou banco leve em memória).
- **Estabilidade da Transmissão (RTMP Pipe)**: Gerenciamento de buffers do FFmpeg e uso de CPU na VM para evitar quedas de frames ou travamentos durante streaming contínuo.
- **Segurança da Stream Key**: Isolamento da chave nos processos de logs de auditoria e logs do sistema.
- **Integridade de Licenciamento (NCS)**: Verificação contínua e automatizada de compliance antes do feed ir ao ar, garantindo que o canal não sofra punições por copyright.

## Starter Template Evaluation

### Primary Technology Domain

**Web Application & Real-time Media Compositor** based on project requirements analysis.

### Starter Options Considered

1. **New Next.js 15 Starter via create-next-app**: Considered if starting fresh. Would provide Next.js 15, React 19, Tailwind CSS 3/4, and TypeScript, but would require manually re-implementing the existing Canvas Aurora background, Genkit integration, and Dashboard components.
2. **Existing Codebase (Next.js 15.5.9 / React 19)**: The project is already bootstrapped with Next.js 15.5.9 (App Router), React 19.2.1, Tailwind CSS 3.4.1, Lucide React, Radix UI (Shadcn/UI), Google Genkit 1.28.0, and form resolution with Zod.

### Selected Starter: Existing Next.js 15.5.9 Codebase

**Rationale for Selection:**
The application has already been successfully structured with a modular architecture and integrates critical features like the Google Genkit AI flow, the dynamic Aurora Boreal Canvas background, and the Dashboard UI. Reusing the existing codebase prevents duplication of work and leverages a pre-configured, type-safe React 19 environment.

**Initialization Command:**
No initialization command is needed as the workspace is already fully set up. For verification of dependencies and running the local development server:
```bash
# Instalação das dependências existentes
npm install

# Inicialização do servidor de desenvolvimento Next.js com Turbopack (porta 9002)
npm run dev

# Inicialização do servidor de desenvolvimento Genkit (IA)
npm run genkit:dev
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5 configuration (`tsconfig.json` ES2017 target in strict mode).
- React 19.2.1 and Next.js 15.5.9 with App Router.

**Styling Solution:**
- Tailwind CSS 3.4.1 with PostCSS 8.
- Dark mode class-based system with HSL variables configured in `src/app/globals.css` and integrated via `tailwind.config.ts`.
- Utility merging using `tailwind-merge` and `clsx` via `src/lib/utils.ts`.

**Build Tooling:**
- Next.js compiler with Turbopack enabled for ultra-fast hot reloading in development.
- Target output is set as static export (`output: 'export'`) in `next.config.ts` (ideal for client-side execution/browser rendering).
- TypeScript and ESLint build errors are ignored for compilation flexibility (`ignoreBuildErrors: true`).

**Testing Framework:**
- None configured in the template. If E2E testing of the media stream and dashboard interactions is required, Playwright or Cypress can be integrated at a later stage.

**Code Organization:**
- **`src/app/`**: Routes, API endpoints (`/api/ai/generate-description`), layout, and global CSS.
- **`src/components/`**: Modularized into features: `streaming/` containing the AuroraBackground, Dashboard, and MiniPlayer; and `ui/` containing Shadcn/UI primitives.
- **`src/ai/`**: Genkit flows and dev server config.
- **`src/assets/`**: Dedicated subdirectories for `audio/`, `video/`, and `details/` (metadata files).

**Development Experience:**
- Hot reloading server out-of-the-box via Next.js dev server.
- Interactive AI flows tester via Genkit developer UI (`genkit:dev`).
- Strict linting rules with ESLint.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **State Synchronization (CLI ↔ Browser)**: Local Node.js WebSocket server + in-memory store with JSON file persistence. Actionable since the CLI and browser must share media playback status and commands without race conditions.
- **RTMP Broadcast Capture**: Puppeteer (v25.1.0) headless instance + `puppeteer-stream` (v3.0.22) + spawned FFmpeg process. Must capture browser video rendering and Web Audio API outputs cleanly.

**Important Decisions (Shape Architecture):**
- **Metadata Storage**: Flat-file JSON schema in `./src/assets/details/{track-id}.json` as described in FR-3.1. Simplifies watcher synchronization and manual metadata entry.
- **YouTube Stream Key Management**: H5 LocalStorage (masked input) + WebSocket transport to backend. Backed up by fallback environment variable `YOUTUBE_STREAM_KEY`.

**Deferred Decisions (Post-MVP):**
- **Auto-Shutdown Presets Timer (FR-4.1)**: Marked as optional. Node.js `setInterval` countdown sequence will be deferred until the core audio/video transmission pipeline is verified.

### Data Architecture

- **Track Metadata Database**: Flat JSON files in `./src/assets/details/{track-id}.json` containing title, artist, genre, subgenre, duration, source link, and AI description.
  - *Rationale*: Eliminates DB setup and migrations, conforms to FR-3.1, and fits the simple flat file structure of the media assets.
  - *Affects*: Asset Sync system, MiniPlayer display.
  - *Provided by Starter*: No.

### Authentication & Security

- **YouTube Stream Key Security**: Key input is masked on the Dashboard and saved in user's browser `localStorage`. On stream start, key is transferred to backend memory via WebSocket connection and used to parameterize the FFmpeg child process. Chave is never written to disk or logs.
  - *Rationale*: Safe hybrid approach conforming to FR-3.2, ensuring user control via UI while preserving VM security.
  - *Affects*: Stream Control, RTMP Bridge.
  - *Provided by Starter*: No.

### API & Communication Patterns

- **CLI ↔ Browser Communication**: A local Node.js server inside the backend processes handles a WebSocket server (`ws://localhost:9003`). The Next.js frontend connects to this socket.
  - *Rationale*: Low-latency (<100ms) bidirectional event-based communication. Actions on the CLI (skip, pause) are broadcast to the browser immediately, and status updates from the browser (e.g. current playback timing) are received by the CLI.
  - *Affects*: CLI Menu, Live Status Dashboard, Audio Sequencer.
  - *Provided by Starter*: No.

### Frontend Architecture

- **Next.js Static Export & Decoupling**: Next.js is configured for static export (`output: 'export'`), producing static HTML/JS overlay pages. Dynamic API routes and AI prompt flows are decoupled from the Next.js server and managed directly in the Node.js backend.
  - *Rationale*: Next.js static builds cannot contain dynamic API routes, requiring full separation of frontend UI from backend streaming/AI workflows.
  - *Affects*: Deployment structure, Next.js build.
  - *Provided by Starter*: Configured in Next.js, but decoupling architecture is custom.

### Infrastructure & Deployment

- **VM Headless Host**: Magalu Cloud VM (Debian/Ubuntu) running Node.js backend + chromium (via Puppeteer) + local FFmpeg package.
  - *Rationale*: Headless Linux VM. Puppeteer will run in headless mode or use Xvfb for rendering the Canvas background.
  - *Affects*: Deployment, setup guidelines.
  - *Provided by Starter*: No.

### Decision Impact Analysis

**Implementation Sequence:**
1. Decouple dynamic API routes and establish the Node.js backend server with a WebSocket listener.
2. Implement CLI interface and state storage synchronizing with the browser WebSocket.
3. Configure Puppeteer screen capture with `puppeteer-stream` and pipe to the spawned FFmpeg RTMP process.
4. Integrate local flat-file JSON metadata parsing and asset watch sync.

**Cross-Component Dependencies:**
- The CLI menu depends on the WebSocket server to query state or send playback commands.
- The FFmpeg live stream depends on the Puppeteer browser instance loading the Next.js static overlay page correctly with audio-video sync.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 áreas de potenciais conflitos de implementação entre agentes de IA foram identificadas e resolvidas através de regras estritas de padronização.

### Naming Patterns

**API & WebSocket Naming:**
- **Padrão de Eventos WebSocket**: Deve seguir a nomenclatura `domain:action` (camelCase).
  - *Exemplos:*
    - CLI para Browser: `media:play`, `media:pause`, `media:skip`, `queue:reorder`
    - Browser para CLI/Servidor: `player:status` (sincronização de progresso), `player:error`
- **Porta padrão**: O WebSocket server local rodará na porta `9003` (`ws://localhost:9003`).

**Code Naming Conventions:**
- **React Components**: PascalCase para componentes e arquivos (`MiniPlayer.tsx`, `AuroraBackground.tsx`).
- **Arquivos auxiliares/Hooks/Utilities**: kebab-case (`use-audio-sequencer.ts`, `compliance-checker.ts`).
- **Variáveis e Funções**: camelCase (`currentTrack`, `skipToNextTrack()`).

### Structure Patterns

**Project Organization:**
- **Componentes do Player/Overlay**: Devem residir em `src/components/streaming/`.
- **Componentes Genéricos UI (Shadcn)**: Em `src/components/ui/`.
- **Backend Node.js & CLI**: Lógica do orchestrador executando fora da build do Next.js deve ser colocada em `/server/` na raiz do projeto (ex: `/server/index.js`, `/server/cli.js`).
- **Fila e Metadados**: Em vez de arquivos JSON isolados por música, os metadados são centralizados no arquivo de texto único `./src/assets/details/music details.txt`.

### Format Patterns

**Metadata TXT Format & Parsing:**
A especificação dos metadados das faixas deve ser lida a partir do arquivo único `./src/assets/details/music details.txt`. O arquivo utiliza separadores triplos (`---`) entre faixas. A aplicação deve parsear o arquivo utilizando regex compatível com as seguintes variações idiomáticas encontradas nos blocos:
- Identificação da Música: prefixo `Song:` ou `Música:`
- Licenciamento: prefixo `Music provided by` ou `Música fornecida por`
- Link de Download/Stream: prefixo `Free Download/Stream:` ou `Download/Streaming gratuito:`
- Link de Vídeo: prefixo `Watch:` ou `Assista:`

**Compliance Audit Logs:**
O log de auditoria exigido em FR-5.0 deve ser persistido em `./logs/compliance-audit.jsonl` usando o formato JSONLines (uma linha JSON por evento) com timestamp ISO 8601:
`{"timestamp": "2026-06-07T04:10:00.000Z", "level": "INFO|WARNING|ERROR", "event": "stream_start|track_play|compliance_check", "trackId": "slug", "status": "APPROVED|REJECTED", "details": "..."}`

### Communication Patterns

**State Management & Updates:**
- O estado de reprodução e fila é centralizado na memória do Servidor Node.js (Single Source of Truth).
- A CLI e o Dashboard são clientes que se conectam ao servidor. Qualquer modificação de estado (ex: Skip na CLI) envia um payload de comando para o servidor, que aplica a mudança no estado central e faz o broadcast para todos os clientes conectados.

### Process Patterns

**Error Handling & Auto-Recovery:**
- **Falha de Decodificação de Áudio**: Se o browser falhar ao decodificar uma faixa de áudio (`AudioContext` erro), ele deve emitir `player:error` via WebSocket. O servidor capturará o erro, registrará no log de auditoria e emitirá um comando `media:skip` automático para pular para a próxima faixa segura.
- **Compliance Skip Behavior**: Se uma música local não estiver listada no arquivo de detalhes (ou seja, não for certificada NoCopyrightSounds na whitelist), o sistema irá **pular automaticamente a faixa (auto-skip)** e registrar o incidente de compliance no log de auditoria, mesmo que a música seja mencionada na descrição da transmissão ou esteja presente na pasta de áudios. A transmissão permanece activa.
- **Falha de Conexão do FFmpeg**: O script backend Node.js deve monitorar a saída do processo FFmpeg. Se o processo morrer inesperadamente, o backend deve tentar uma reconexão automática com backoff exponencial limitada a 5 tentativas antes de notificar a CLI.

### Enforcement Guidelines

**All AI Agents MUST:**
1. Validar cada faixa de áudio `.mp3` contra os blocos do arquivo `./src/assets/details/music details.txt` antes de adicioná-la à fila de reprodução ativa.
2. Pular automaticamente (skip) qualquer faixa que não passe na validação de conformidade da whitelist da NCS.
3. Não logar ou imprimir em console a variável de ambiente contendo a `YOUTUBE_STREAM_KEY`.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
project/
├── .env                                 # Variáveis de ambiente (ex: YOUTUBE_STREAM_KEY)
├── package.json                         # Dependências do Next.js 15.5.9 e do Backend Node.js
├── tsconfig.json                        # Configuração estrita do TypeScript 5
├── next.config.ts                       # Next.js com output static export ('export')
├── tailwind.config.ts                   # Variáveis de tema do Tailwind CSS 3.4.1
├── doc.md                               # Documentação de referência interna
├── docs/
│   └── blueprint.md                     # Visão geral de produto do AuraStream
├── logs/
│   └── compliance-audit.jsonl           # Logs de auditoria persistentes em formato JSONLines
├── server/                              # Servidor Node.js backend (Orchestrator)
│   ├── server.ts                        # WebSocket + HTTP Server (Single Source of Truth)
│   ├── cli.ts                           # Interface CLI do Operador (Terminal Terminal-kit/Inquirer)
│   ├── watcher.ts                       # Monitor de diretórios (fs.watch/chokidar) para assets de áudio
│   ├── stream.ts                        # Orquestrador da ponte Puppeteer (v25.1.0) -> FFmpeg
│   └── compliance.ts                    # Analisador de conformidade de "music details.txt"
├── src/                                 # Código do Frontend Next.js (Visual Compositor)
│   ├── ai/                              # Módulos do Google Genkit
│   │   └── flows/
│   ├── app/
│   │   ├── api/                         # Endpoints locais (Genkit API de IA)
│   │   │   └── ai/
│   │   │       └── generate-description/
│   │   │           └── route.ts
│   │   ├── globals.css                  # Folha de estilo global com variáveis HSL
│   │   ├── layout.tsx                   # Layout global do Next.js
│   │   └── page.tsx                     # Página principal compositora (Aurora Canvas + MiniPlayer)
│   ├── components/
│   │   ├── streaming/
│   │   │   ├── AuroraBackground.tsx     # Componente Canvas da Aurora Boreal animada
│   │   │   ├── Dashboard.tsx            # Painel do Dashboard de Operações Web
│   │   │   └── MiniPlayer.tsx           # Cinematic overlay renderizado no feed
│   │   └── ui/                          # Primitivos Shadcn UI
│   ├── hooks/
│   ├── lib/
│   │   └── utils.ts
│   └── assets/                          # Assets estáticos
│       ├── audio/                       # Diretório contendo os arquivos .mp3
│       ├── details/
│       │   └── music details.txt        # Arquivo txt contendo os metadados NCS das faixas
│       └── video/                       # Fallbacks de vídeo
├── tests/
│   ├── e2e/                             # Testes Playwright (Integridade do Stream e performance Canvas)
│   └── unit/                            # Testes unitários do parser de TXT e do sequenciador
```

### Architectural Boundaries

**API Boundaries:**
- **WebSocket Connection (`ws://localhost:9003`)**: Comunicação bidirecional orientada a eventos para sincronização de estado instantânea. O frontend do browser e o terminal CLI conectam-se como clientes deste WebSocket.
- **REST Endpoints (`http://localhost:9002/api`)**: Endpoints dinâmicos locais expostos para integração com o Google Genkit.

**Component Boundaries:**
- **Visual Compositor (Browser/Next.js)**: Componente puramente de apresentação em tempo de stream (executa o canvas animado da Aurora, renderiza o Miniplayer do overlay, decodifica áudio local e toca na Web Audio API). Não escreve no disco ou logs da VM; depende apenas de dados vindos do WebSocket.
- **Orchestrator Backend (Node.js)**: Módulo em nível de servidor. Controla os subprocessos (spawna o Puppeteer em headless que carrega a página local do compositor; spawna o FFmpeg que consome o fluxo de áudio/vídeo do Puppeteer e envia ao YouTube). 

**Data Boundaries:**
- **State Store**: O estado da fila ativa, música atual e status da live são mantidos em memória RAM no processo `server.ts` do Node.js. O estado é persistido localmente em `server/state-cache.json` apenas em mutações.
- **Metadata Cache**: O arquivo `music details.txt` é lido e parseado no boot do servidor pelo `compliance.ts` e armazenado na RAM como um dicionário chave-valor (mapeado pelo slug da música) para busca instantânea.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Automated Audio Sequencer (FR-1.1)**: Interface de áudio em `src/components/streaming/` no browser; Fila e crossfade em `src/app/page.tsx` controlado via Web Audio API.
- **Asset Watcher (FR-1.3)**: Implementado em `server/watcher.ts` monitorando `src/assets/audio/`, enviando modificações de fila para o `server.ts` que notifica todos os clientes via WebSocket.
- **Operator Interfaces (FR-2.0)**: Dashboard Web em `src/components/streaming/Dashboard.tsx` e CLI em `server/cli.ts`.
- **RTMP Broadcast (FR-3.2)**: Pipeline implementado em `server/stream.ts` gerenciando o ciclo de vida do Puppeteer e FFmpeg.
- **NCS Compliance & Auditing (FR-5.0)**: Lógica em `server/compliance.ts` validando faixas no carregamento da fila e gravando transições aprovadas/rejeitadas em `logs/compliance-audit.jsonl`. Pular automaticamente (skip) qualquer faixa que não passe na validação de conformidade da whitelist da NCS.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
A arquitetura híbrida que separa a UI estática (Next.js `output: 'export'`) do servidor orquestrador Node.js rodando localmente na VM da Magalu Cloud é totalmente compatível. O uso de WebSocket (`ws://localhost:9003`) elimina qualquer conflito de comunicação entre a CLI headless e o player de áudio/vídeo no browser do Puppeteer.

**Pattern Consistency:**
Os padrões de nomenclatura de eventos WebSocket (`domain:action`) e a convenção de arquivos/variáveis garantem consistência entre o frontend React 19 e a CLI do backend. O formato de log em JSONLines (`logs/compliance-audit.jsonl`) é ideal para ferramentas de auditoria e consumo rápido.

**Structure Alignment:**
A estrutura física proposta separa claramente o diretório `/server/` (onde rodam os processos Node.js, CLI, monitor de assets e orquestração do stream) do diretório `/src/` (focado na construção estática da interface e do player). As fronteiras de responsabilidade estão bem delimitadas.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
Todas as funcionalidades críticas do AuraStream v2.0 estão cobertas.

**Functional Requirements Coverage:**
- **FR-1.1 & FR-1.4 (Audio Sequencer)**: Web Audio API no browser, com fila e comandos enviados e centralizados pelo servidor local Node.
- **FR-1.2 & FR-3.2 (RTMP Broadcast)**: Puppeteer headless capturando a aba de renderização local Next.js e injetando via pipe de stream no processo filho FFmpeg configurado com a Stream Key de transmissão.
- **FR-1.3 (Asset Watcher)**: Módulo de servidor usando `fs.watch`/`chokidar` no diretório de áudio, disparando eventos de sincronização via WebSocket.
- **FR-2.3 (CLI Interface)**: Terminal CLI conectado via WebSocket ao servidor para orquestração headless de comandos.
- **FR-5.0 (Compliance & Audit)**: Parser e validador no servidor rodando antes e durante o stream baseado no arquivo `music details.txt`, registrando todas as movimentações no auditor.

**Non-Functional Requirements Coverage:**
- **Latência & Sync**: WebSocket local de baixíssima latência (<50ms) garante que os comandos da CLI sincronizem instantaneamente no browser compositor.
- **Performance**: O canvas da Aurora Boreal foi desenhado para rodar a 30fps de modo a economizar recursos de CPU da VM para a codificação de vídeo em tempo real no FFmpeg.
- **Segurança**: A Stream Key é transitada apenas em memória RAM e variáveis de ambiente locais, nunca gravada em logs.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Todas as decisões estruturais, de stack e operacionais foram documentadas.

**Structure Completeness:**
O mapeamento físico das pastas está claro e amarra cada requisito do PRD a arquivos específicos.

**Pattern Completeness:**
Os padrões de parse de metadados baseados no arquivo `.txt` existente e o fluxo de auto-skip para faixas que falham no compliance foram mapeados conforme requisições do usuário.

### Gap Analysis Results

**Critical Gaps:**
- Nenhum gap impeditivo detectado.

**Important Gaps:**
- **Regex de Parsing**: O parser de `music details.txt` precisará ser flexível o suficiente para lidar com variações nas strings (`Música:` vs `Song:`), o que será implementado e validado por testes unitários dedicados em `tests/unit/`.

**Nice-to-Have Gaps:**
- Integração de alertas sonoros na CLI ao pular músicas por não conformidade (melhoria futura opcional).

### Validation Issues Addressed
O formato do banco de dados de metadados foi alterado de múltiplos arquivos JSON para parsing centralizado a partir do arquivo único txt `./src/assets/details/music details.txt`. O comportamento de auditoria contra NCS foi configurado para pular faixas não conformes automaticamente (`auto-skip`), garantindo a continuidade ininterrupta da transmissão da rádio.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** high

**Key Strengths:**
- Desacoplamento híbrido limpo que preserva a simplicidade do Next.js estático e a robustez do backend Node.js.
- Ponte de baixa latência via WebSocket para sincronização da CLI.
- Auditoria de NCS proativa e resiliente que previne strikes sem derrubar a live.

**Areas for Future Enhancement:**
- Mecanismo de backup secundário de stream para servidores RTMP alternativos em caso de perda de conexão primária com o YouTube.

### Implementation Handoff

**AI Agent Guidelines:**
- Siga as fronteiras do projeto e implemente o backend Node.js estritamente dentro da pasta `/server/`.
- Siga as especificações de eventos WebSocket descritas para manter a interoperabilidade entre frontend, CLI e orquestrador.
- Garanta que as regras de compliance e logs JSONLines sejam rigidamente respeitadas.

**First Implementation Priority:**
Executar a separação de escopos criando o servidor WebSocket básico (`server/server.ts`) para sincronização e o cliente CLI inicial (`server/cli.ts`), estabelecendo a espinha dorsal de comunicação do projeto.
