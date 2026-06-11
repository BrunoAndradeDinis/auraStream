---
stepsCompleted: [1, 2]
inputDocuments: 
  - "_bmad-output/planning-artifacts/prd-v2-0-aurastream/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-project-aura-2026-06-09/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-project-aura-2026-06-09/EXPERIENCE.md"
---

# AuraStream v2.0 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AuraStream v2.0, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Sequenciador de Áudio Automatizado (FR-1.1) - Leitura de áudios em `./src/assets/audio/`, loop contínuo, crossfade de 500ms via Web Audio API, controle de fila interativo (Play, Pause, Skip, drag-drop, volume).
FR2: Ponte RTMP para YouTube (FR-1.2) - Captura de render local e áudio via Puppeteer/FFmpeg transmitindo em 1080p@30fps para o YouTube com reconexão automática.
FR3: Asset Synchronization (FR-1.3) - Monitoramento contínuo em tempo real (`fs.watch`) dos diretórios de áudio e metadados atualizando a fila sem restart da aplicação.
FR4: Operações de Controle de Stream (FR-1.4) - Ações de Pause (para áudio mas mantém vídeo ao vivo), Continue, Stop (desconecta stream) e Restart.
FR5: Dashboard de Monitoramento Pessoal (FR-2.1) - Painel Web com sidebar de status, área central com configurações de stream (bitrate, res), fila de reprodução interativa e logs.
FR6: MiniPlayer Cinematic Overlay (FR-2.2) - Overlay passivo no canto inferior direito para o feed do YouTube, mostrando título, artista, gênero e descrição IA gerada com efeito pulsante de Aurora.
FR7: Interface CLI de Terminal (FR-2.3) - Menu interativo de terminal via Inquirer/Chalk para rodar a operação do sistema headless na VM (Start, Pause, Status, etc).
FR8: Parsing de Metadados Centralizado (FR-3.1 modificado) - O sistema deve ler e extrair detalhes das músicas a partir de um único arquivo plano (`./src/assets/details/music details.txt`), lidando com formatações dinâmicas.
FR9: Gestão Segura da YouTube Stream Key (FR-3.2) - Armazenamento seguro via localStorage ou fallback de `.env`, com input mascarado na interface, sem exibir a chave nos logs.
FR10: Auto-Shutdown Timers (FR-4.1) - Automação de desligamento temporizado (presets 1h-3w) com alerta sonoro 5min antes e finalização "graceful" do stream.
FR11: Compliance e Audit NCS (FR-5.0) - Sistema de "auto-skip" bloqueador para faixas que falhem no regex de validação oficial NCS, logando aprovações/rejeições em `./logs/compliance-audit.jsonl`.

### NonFunctional Requirements

NFR1: Atraso de Áudio/Vídeo - A latência e sincronia do buffer do Puppeteer para o FFmpeg deve possuir tolerância de ±50ms.
NFR2: Performance UI - Renderização do MiniPlayer a 60fps estáveis e Animações da Aurora rodando de forma otimizada a 30fps para alívio da CPU.
NFR3: Resposta de Interface - Feedback visual do Dashboard e da CLI devem ocorrer em menos de 100ms e 200ms, respectivamente.
NFR4: Alta Disponibilidade - Tolerância de 5 tentativas de reconexão automática ao YouTube em caso de drop de conexão da rede.
NFR5: Sincronia Headless/Browser - O tráfego bidirecional via WebSocket (porta 9003) deve sincronizar os estados instantaneamente sem race conditions.

### Additional Requirements

- [Utilizar template Next.js 15 Existente] A implementação começará utilizando a estrutura do repositório já configurada com Tailwind, Shadcn e integração do Genkit (Epic 1 / Story 1).
- [Arquitetura Desacoplada] Rotas de API dinâmicas Node.js (Servidor) devem ser completamente isoladas do frontend Web (`output: export`), que funcionará apenas via comunicação WebSocket/cliente.
- [Spawning Isolado] O pipeline RTMP será implementado em Node.js (`server/stream.ts`) orquestrando instâncias do Chromium (Puppeteer-stream) e do FFmpeg independentemente da UI Web.

### UX Design Requirements

UX-DR1: Implementar o design system Abyssal Aurora (Tokens: Fundo `#000000`, Surface `#020617`, Accents em Cyan `#00F0FF` e Roxo `#7C3AED`).
UX-DR2: Aplicar sistema tipográfico híbrido (Outfit para Heading e JetBrains Mono para Interface Log e Fila).
UX-DR3: Estruturar o layout "Comfortable Density" utilizando paddings largos de 24px e bordas de 16px (`{rounded.large}`).
UX-DR4: Implementar o padrão visual de "Glassmorphism" em painéis, usando background color translúcida com `backdrop-blur` sobre a tela.
UX-DR5: Aplicar movimento fluido de `ease-in-out` de 200-300ms a botões e modais para eliminar cortes bruscos da UI.
UX-DR6: Integrar a renderização suave em Canvas da "Aurora Boreal" tanto para o MiniPlayer da stream quanto atenuada no background do Dashboard.
UX-DR7: Construir interações arrastáveis (Drag and Drop) para reordenação visual da Fila, atrelando elevação do componente e gerando toasty com `slide-up` de confirmação ao soltar.

### FR Coverage Map

| Requisito | Epic | Descricao |
|---|---|---|
| FR1 (Sequenciador) | Epic 2 | Motor de audio + crossfade via Web Audio API |
| FR2 (RTMP Bridge) | Epic 2 | Pipeline Puppeteer -> FFmpeg -> YouTube |
| FR3 (Asset Sync) | Epic 3 | fs.watch nos diretorios de audio/detalhes |
| FR4 (Stream Controls) | Epic 2 | Pause/Continue/Stop/Restart na CLI e Dashboard |
| FR5 (Dashboard) | Epic 4 | Painel de monitoramento completo |
| FR6 (MiniPlayer) | Epic 4 | Overlay cinematic na stream |
| FR7 (CLI) | Epic 1 | Menu interativo de terminal via Inquirer |
| FR8 (Metadata Parser) | Epic 3 | Parser flexivel do music details.txt |
| FR9 (Stream Key) | Epic 2 | Armazenamento seguro via localStorage/.env |
| FR10 (Auto-shutdown) | Epic 5 | Timers automatizados (opcional) |
| FR11 (Compliance NCS) | Epic 3 | Auto-skip + log de auditoria |
| NFR1 (Sync A/V) | Epic 2 | Controle de buffer no pipeline FFmpeg |
| NFR2 (60fps UI) | Epic 4 | Canvas da Aurora otimizado a 30fps |
| NFR3 (Resposta UI) | Epic 4 | Feedback < 100ms no Dashboard |
| NFR4 (Reconexao) | Epic 2 | Backoff exponencial de 5 tentativas |
| NFR5 (WebSocket sync) | Epic 1 | Single Source of Truth no servidor Node |
| UX-DR1 a UX-DR7 | Epic 4 | Tokens Abyssal Aurora, glassmorphism, motion |

## Epic List

### Epic 1: Fundacao do Servidor e Comunicacao em Tempo Real
Bruno pode iniciar o sistema a partir do terminal, com o servidor Node.js rodando, WebSocket ativo (porta 9003) e a CLI interativa respondendo a comandos basicos. A espinha dorsal de comunicacao headless esta operacional.
**FRs cobertos:** FR7, NFR5, Requisitos Arquiteturais (template existente, desacoplamento, spawning isolado)

### Epic 2: Motor de Audio e Transmissao RTMP
Bruno pode iniciar uma transmissao musical com crossfade suave, pausar e retomar sem interromper o sinal RTMP, e controlar a fila (Play, Pause, Skip, Volume) tanto pelo Dashboard quanto pela CLI. O YouTube recebe o sinal ao vivo sem interrupcoes.
**FRs cobertos:** FR1, FR2, FR4, FR9, NFR1, NFR2, NFR4

### Epic 3: Asset Sync, Metadata e Compliance NCS
Bruno pode soltar novas musicas na pasta de audios e o sistema detecta, valida a conformidade NCS automaticamente e as adiciona a fila sem nenhum restart da aplicacao, com trilha de auditoria completa garantida em disco.
**FRs cobertos:** FR3, FR8, FR11

### Epic 4: Interface Visual - Dashboard e MiniPlayer Cinematic
Bruno tem acesso a um Dashboard elegante (Abyssal Aurora, glassmorphism) para monitorar a transmissao, reordenar a fila via drag-drop e verificar o status de compliance. Os espectadores do YouTube veem o MiniPlayer cinematic com Aurora Boreal animada exibindo a faixa atual.
**FRs cobertos:** FR5, FR6, NFR3, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7

### Epic 5: Automacao e Descricoes via IA (Opcional)
Bruno pode agendar o encerramento automatico da transmissao com um preset de tempo, recebendo um aviso 5min antes do shutdown. As musicas exibem no MiniPlayer uma descricao poetica gerada via Genkit/AI.
**FRs cobertos:** FR10, FR6 (aiDescription)

---

## Epic 1: Fundação do Servidor e Comunicação em Tempo Real

Bruno pode iniciar o sistema a partir do terminal, com o servidor Node.js rodando, WebSocket ativo (porta 9003) e a CLI interativa respondendo a comandos básicos. A espinha dorsal de comunicação headless está operacional.

**FRs cobertos:** FR7, NFR5, Requisitos Arquiteturais

### Story 1.1: Configurar Dependências e Scripts do Servidor Backend

Como Bruno (operador do AuraStream),
Eu quero que as dependências Node.js do servidor e os scripts de inicialização estejam configurados no projeto,
Para que eu possa instalar e rodar o backend sem conflito com o frontend Next.js.

**Esforço estimado:** ~1h

**Acceptance Criteria:**

**Given** o `package.json` raiz do projeto existente
**When** Bruno executa `npm install`
**Then** as dependências `ws`, `ts-node`, `@types/ws` e `inquirer` estão instaladas
**And** o `package.json` contém os scripts `"server": "ts-node server/server.ts"` e `"cli": "ts-node server/cli.ts"`
**And** um `tsconfig.server.json` separado existe na raiz apontando para `server/` com `module: commonjs` e `target: es2020`
**And** executar `npm run server` não gera conflito de porta com o `npm run dev` do Next.js (porta 9002)

---

### Story 1.2: Criar o Servidor WebSocket com Ciclo de Vida de Conexões

Como Bruno,
Eu quero que o arquivo `server/server.ts` suba um servidor WebSocket funcional na porta 9003,
Para que clientes (CLI e browser) possam se conectar e desconectar sem erros.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** as dependências da Story 1.1 estão instaladas
**When** `npm run server` é executado
**Then** o terminal exibe `[server] WS listening on ws://localhost:9003`
**And** quando um cliente conecta, o servidor loga `[server] client connected (total: N)`
**And** quando um cliente desconecta, o servidor loga `[server] client disconnected (total: N)` sem crash
**And** o servidor continua rodando estável após múltiplas conexões e desconexões consecutivas

---

### Story 1.3: Implementar State Store em Memória com Persistência JSON

Como Bruno,
Eu quero que o servidor mantenha um objeto de estado global em RAM e o persista em `server/state-cache.json` a cada mutação,
Para que o sistema sobreviva a um restart e retome do último estado conhecido.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** `server/server.ts` está rodando
**When** o servidor inicia pela primeira vez (sem `state-cache.json` existente)
**Then** o arquivo `server/state-cache.json` é criado com `{ "queue": [], "currentTrack": null, "status": "idle", "streamKey": null }`
**And** quando o servidor inicia com `state-cache.json` existente, ele carrega o estado anterior em memória
**And** quando uma função `setState(patch)` é chamada internamente, ela faz merge do patch no estado e persiste o JSON sem bloquear o event loop
**And** a `streamKey` nunca é gravada no `state-cache.json`

---

### Story 1.4: Implementar Broadcasting de Eventos WebSocket (domain:action)

Como Bruno,
Eu quero que qualquer evento enviado por um cliente seja processado pelo servidor e re-transmitido a todos os clientes com o estado atualizado,
Para que CLI e browser estejam sempre sincronizados com a mesma fonte de verdade.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** dois ou mais clientes estão conectados ao servidor WebSocket
**When** um cliente envia uma mensagem JSON no formato `{ "event": "media:skip" }`
**Then** o servidor processa o evento, aplica a mutação de estado e transmite `{ "event": "server:state_sync", "payload": { ...estadoAtual } }` para TODOS os clientes conectados
**And** o broadcast ocorre em menos de 50ms após o recebimento do evento
**And** se um cliente envia um evento com formato inválido (não-JSON), o servidor loga um warning sem crash
**And** eventos desconhecidos retornam `{ "event": "server:error", "payload": "Unknown event" }` apenas para o cliente emissor

---

### Story 1.5: Implementar Sincronização de Estado para Novos Clientes

Como Bruno,
Eu quero que qualquer cliente que se conecte ao servidor receba imediatamente o estado atual da transmissão,
Para que o Dashboard e a CLI sempre mostrem a situação real ao abrir.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o servidor está rodando com um estado não-vazio (ex: `{ "status": "streaming", "queue": [...] }`)
**When** um novo cliente WebSocket se conecta
**Then** o servidor envia imediatamente `{ "event": "server:state_sync", "payload": { ...estadoAtual } }` como primeira mensagem
**And** o envio acontece em menos de 100ms após a conexão ser estabelecida
**And** esse envio inicial NÃO é re-transmitido para os demais clientes já conectados

---

### Story 1.6: Criar o Menu Principal da CLI com Inquirer

Como Bruno,
Eu quero que `npm run cli` exiba um menu interativo no terminal com todas as opções de operação do sistema,
Para que eu possa operar o AuraStream de forma headless sem precisar do browser.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** `npm run cli` é executado
**When** o menu principal é exibido
**Then** as seguintes opções são visíveis com headers em Cyan via Chalk: Start Streaming, Pause, Continue, Stop, Skip Track, View Queue, Configure Stream Key, View Logs, Exit
**And** selecionar "Exit" encerra o processo da CLI graciosamente sem erros
**And** selecionar qualquer outra opção exibe `[Connecting to server...]` enquanto tenta conectar ao WebSocket

---

### Story 1.7: Conectar a CLI ao Servidor WebSocket e Enviar Comandos

Como Bruno,
Eu quero que cada opção do menu da CLI envie o evento WebSocket correto para o servidor e exiba a resposta em menos de 200ms,
Para que os comandos do terminal tenham efeito imediato no estado do sistema.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** o servidor WebSocket está rodando em `ws://localhost:9003`
**When** Bruno seleciona uma opção no menu da CLI
**Then** a CLI conecta ao WebSocket, envia o evento correspondente (ex: `{ "event": "media:skip" }`) e aguarda a resposta
**And** quando o servidor retorna `server:state_sync`, a CLI exibe a confirmação da ação em menos de 200ms
**And** quando o servidor NÃO está disponível, a CLI exibe `[ERROR] Server not running. Start with: npm run server` sem crash
**And** a opção "Configure Stream Key" usa input mascarado (`type: 'password'`) e NUNCA exibe a chave em texto plano nos logs

---

## Epic 2: Motor de Áudio e Transmissão RTMP

Bruno pode iniciar uma transmissão musical com crossfade suave, pausar e retomar sem interromper o sinal RTMP, e controlar a fila (Play, Pause, Skip, Volume) tanto pelo Dashboard quanto pela CLI. O YouTube recebe o sinal ao vivo sem interrupções.

**FRs cobertos:** FR1, FR2, FR4, FR9, NFR1, NFR2, NFR4

### Story 2.1: Implementar Carregamento da Fila de Áudio do Diretório Local

Como Bruno,
Eu quero que o servidor leia automaticamente os arquivos `.mp3` de `./src/assets/audio/` ao iniciar e os adicione à fila de estado,
Para que a fila esteja populada e pronta para tocar sem necessidade de configuração manual.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** existem arquivos `.mp3` em `./src/assets/audio/`
**When** `npm run server` é iniciado
**Then** o servidor lê todos os arquivos `.mp3` do diretório, cria um array de objetos `{ id, filename, path }` e popula `state.queue`
**And** a fila é ordenada alfabeticamente por padrão
**And** arquivos com extensões não suportadas (ex: `.txt`) são ignorados silenciosamente
**And** o estado com a fila populada é persistido em `server/state-cache.json`

---

### Story 2.2: Criar a Página Compositora Next.js com Web Audio API

Como Bruno,
Eu quero que a página principal do Next.js carregue e decodifique o primeiro arquivo de áudio da fila via Web Audio API,
Para que o browser esteja pronto para reproduzir e capturar áudio quando o stream iniciar.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** a fila no estado do servidor tem pelo menos uma faixa e o browser carrega `localhost:9002`
**When** a página Next.js monta e recebe `server:state_sync` via WebSocket com a fila
**Then** o browser cria um `AudioContext` e carrega o arquivo da `currentTrack` via `fetch` + `decodeAudioData`
**And** o áudio começa a tocar automaticamente em loop quando o evento `media:play` é recebido
**And** erros de decodificação emitem `{ "event": "player:error", "payload": "decode_failed" }` de volta ao servidor
**And** o `AudioContext` é criado apenas após um gesto do usuário para respeitar políticas de autoplay dos browsers

---

### Story 2.3: Implementar Crossfade Suave entre Faixas (500ms)

Como Bruno,
Eu quero que a transição entre duas faixas seja feita com crossfade de 500ms via `GainNode` da Web Audio API,
Para que não haja silêncio ou corte abrupto perceptível pelos espectadores do YouTube.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** o áudio da faixa atual está tocando no browser
**When** a faixa atual termina ou o evento `media:skip` é recebido
**Then** um `GainNode` faz fade-out da faixa atual de `1.0 → 0.0` em 500ms usando `linearRampToValueAtTime`
**And** simultaneamente, a próxima faixa inicia com `GainNode` fazendo fade-in de `0.0 → 1.0` em 500ms
**And** após o crossfade, o servidor recebe `{ "event": "player:track_changed", "payload": { "trackId": "..." } }` e atualiza `state.currentTrack`
**And** se a fila estiver vazia ao fim de uma faixa, o sistema retorna à primeira faixa e emite `{ "event": "player:queue_looped" }`

---

### Story 2.4: Implementar Controles de Áudio via Eventos WebSocket

Como Bruno,
Eu quero que os eventos `media:play`, `media:pause`, `media:skip` e `media:volume` sejam tratados pelo browser e afetem a reprodução em tempo real,
Para que eu possa controlar a música tanto pela CLI quanto pelo Dashboard.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o browser está conectado ao WebSocket e uma faixa está tocando
**When** o evento `media:pause` é recebido
**Then** o `AudioContext` é suspenso (`context.suspend()`) sem fechar a conexão WebSocket
**When** o evento `media:play` é recebido após pause
**Then** o `AudioContext` é retomado (`context.resume()`) sem recomeçar a faixa do início
**When** o evento `media:skip` é recebido
**Then** o crossfade de 500ms é iniciado para a próxima faixa (conforme Story 2.3)
**When** `{ "event": "media:volume", "payload": 0.7 }` é recebido
**Then** o `GainNode` master é ajustado para `0.7` em 100ms usando `linearRampToValueAtTime`

---

### Story 2.5: Configurar Gestão Segura da Stream Key

Como Bruno,
Eu quero que a Stream Key do YouTube possa ser configurada via CLI e armazenada apenas em memória no servidor,
Para que ela esteja disponível para o pipeline FFmpeg sem nunca aparecer em logs ou arquivos.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** Bruno seleciona "Configure Stream Key" na CLI
**When** Bruno digita a chave no campo mascarado e confirma
**Then** a CLI envia `{ "event": "config:stream_key", "payload": "rtmp://..." }` via WebSocket
**And** o servidor armazena a chave apenas em `state.streamKey` (variável em memória)
**And** a chave NÃO é gravada em `state-cache.json`, em nenhum log, nem exibida em qualquer `console.log`
**And** se `state.streamKey` for null ao tentar iniciar o stream, o servidor retorna `{ "event": "server:error", "payload": "stream_key_missing" }`
**And** se `process.env.YOUTUBE_STREAM_KEY` estiver definido no `.env`, ele é usado como fallback automático

---

### Story 2.6: Implementar o Pipeline Puppeteer → FFmpeg para Transmissão RTMP

Como Bruno,
Eu quero que `server/stream.ts` abra o browser headless via Puppeteer capturando a aba do compositor e pipe o stream para o FFmpeg,
Para que o YouTube receba o sinal ao vivo em 1080p@30fps.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** a Stream Key está em memória e o Next.js está rodando em `localhost:9002`
**When** o servidor recebe o evento `media:start_stream`
**Then** `server/stream.ts` lança o Puppeteer headless e carrega `http://localhost:9002`
**And** o stream de vídeo+áudio é capturado via `puppeteer-stream` e pipeado para um processo filho FFmpeg
**And** o FFmpeg transmite para `rtmp://a.rtmp.youtube.com/live2/{STREAM_KEY}` com bitrate de 3500k e resolução 1920×1080
**And** `state.status` é atualizado para `"streaming"` com broadcast para todos os clientes
**And** a Stream Key NUNCA aparece nos logs — o comando FFmpeg é executado sem logar os argumentos completos

---

### Story 2.7: Implementar Reconexão Automática com Backoff Exponencial

Como Bruno,
Eu quero que o sistema tente reconectar automaticamente ao YouTube caso o processo FFmpeg caia inesperadamente,
Para que transmissões longas se recuperem de quedas de rede sem intervenção manual.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o stream está ativo e o processo FFmpeg cai com código de saída diferente de `0`
**When** o evento `close` do processo FFmpeg é detectado
**Then** o servidor aguarda `2^tentativa` segundos (2s, 4s, 8s, 16s, 32s) antes de cada tentativa de reconexão
**And** são realizadas no máximo 5 tentativas antes de marcar `state.status` como `"offline"` e emitir `{ "event": "server:stream_failed" }`
**And** cada tentativa é logada como `[stream] reconnect attempt N/5`
**And** se `media:stop_stream` for chamado durante a reconexão, todas as tentativas são canceladas imediatamente

---

### Story 2.8: Implementar Controles Stop e Restart do Stream

Como Bruno,
Eu quero poder parar a transmissão encerrando a conexão com o YouTube e reiniciá-la do zero via CLI,
Para que eu tenha controle completo do ciclo de vida da live sem matar processos manualmente.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o stream está ativo (`state.status === "streaming"`)
**When** o evento `media:stop_stream` é recebido
**Then** o processo FFmpeg é encerrado via `SIGTERM`, com espera de até 5s antes de forçar `SIGKILL`
**And** `state.status` é atualizado para `"idle"` com broadcast do novo estado para todos os clientes
**When** o evento `media:restart_stream` é recebido
**Then** o estado da fila é preservado, o contador de tentativas é zerado e o pipeline Puppeteer+FFmpeg é relançado do início

---

## Epic 3: Asset Sync, Metadata e Compliance NCS

Bruno pode soltar novas músicas na pasta de áudios e o sistema detecta, valida a conformidade NCS automaticamente e as adiciona à fila sem nenhum restart da aplicação, com trilha de auditoria completa garantida em disco.

**FRs cobertos:** FR3, FR8, FR11

### Story 3.1: Implementar o Watcher de Diretório de Áudio (`server/watcher.ts`)

Como Bruno,
Eu quero que o servidor monitore automaticamente `./src/assets/audio/` em busca de novos arquivos `.mp3` ou remoções,
Para que eu possa adicionar músicas à transmissão sem precisar reiniciar nenhum processo.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o servidor está rodando e `./src/assets/audio/` existe
**When** um novo arquivo `.mp3` é copiado para o diretório
**Then** em até 1s o servidor detecta o arquivo via `chokidar` com debounce de 500ms
**And** o arquivo é adicionado ao final de `state.queue` e o novo estado é transmitido via broadcast a todos os clientes
**And** um log `[watcher] audio added: filename.mp3` é impresso no servidor
**When** um arquivo `.mp3` é removido do diretório
**Then** se a faixa ainda não tocou, ela é removida de `state.queue`; se estiver tocando agora, o skip para a próxima faixa é acionado automaticamente
**And** arquivos não-`.mp3` adicionados ao diretório são ignorados sem log de erro

---

### Story 3.2: Implementar o Watcher do Arquivo de Metadados (`details/`)

Como Bruno,
Eu quero que o servidor também monitore `./src/assets/details/` para detectar atualizações no arquivo `music details.txt`,
Para que alterações nos metadados NCS sejam refletidas na whitelist de compliance sem restart.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o servidor está rodando com `music details.txt` já carregado em memória
**When** o arquivo `music details.txt` é modificado e salvo
**Then** em até 1s o watcher detecta a mudança e re-dispara o parser de metadados (Story 3.3)
**And** o servidor loga `[watcher] metadata file updated, re-parsing...`
**And** o cache de metadados em memória é atualizado atomicamente sem reiniciar o servidor ou desconectar clientes WebSocket

---

### Story 3.3: Implementar o Parser de Metadados do `music details.txt`

Como Bruno,
Eu quero que `server/compliance.ts` leia e parse o arquivo `./src/assets/details/music details.txt` em um dicionário de metadados indexado pelo slug da música,
Para que o sistema possa validar qualquer faixa da fila de forma instantânea em memória.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** o arquivo `music details.txt` contém blocos separados por `---` com campos variados
**When** a função `parseMetadata()` é chamada
**Then** cada bloco é transformado em um objeto `{ title, artist, source, downloadLink, watchLink }` extraindo os campos com regex flexível para `Song:|Música:`, `Music provided by|Música fornecida por`, `Free Download/Stream:|Download gratuito:` e `Watch:|Assista:`
**And** o resultado é um `Map<string, TrackMetadata>` onde a chave é o slug normalizado do título (lowercase, espaços → hífens)
**And** blocos malformados (sem campo `Song`/`Música`) são ignorados com log de warning `[compliance] skipped malformed block at line N`
**And** o parser processa um arquivo com 200+ blocos em menos de 200ms

---

### Story 3.4: Implementar o Validador de Conformidade NCS

Como Bruno,
Eu quero que `server/compliance.ts` exponha uma função `validateTrack(trackId)` que verifica se uma faixa está na whitelist parseada,
Para que somente faixas certificadas NCS sejam permitidas na transmissão ao vivo.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o cache de metadados está populado em memória
**When** `validateTrack("nome-da-musica")` é chamada para uma faixa presente nos metadados
**Then** a função retorna `{ valid: true, metadata: { title, artist, source } }`
**When** `validateTrack("musica-desconhecida")` é chamada para uma faixa ausente
**Then** a função retorna `{ valid: false, reason: "not_in_whitelist" }`
**And** a validação ocorre em menos de 5ms (lookup em Map, sem I/O)
**And** a função é pura e testável isoladamente sem dependências de efeitos colaterais

---

### Story 3.5: Implementar o Auto-Skip de Faixas Não Conformes

Como Bruno,
Eu quero que qualquer faixa que falhe na validação NCS seja automaticamente pulada ao entrar em reprodução,
Para que o canal nunca transmita música sem certificação NCS, mesmo que ela exista na pasta de áudios.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** a fila tem uma mistura de faixas conformes e não conformes
**When** o servidor processa a transição para uma nova faixa (início do stream ou `player:track_changed`)
**Then** o servidor chama `validateTrack()` antes de emitir `media:play` para o browser
**And** se `valid === false`, o servidor pula para a próxima faixa sem emitir `media:play` para a faixa rejeitada
**And** o servidor emite broadcast `{ "event": "server:compliance_skip", "payload": { "trackId": "...", "reason": "not_in_whitelist" } }` para todos os clientes
**And** se TODAS as faixas da fila forem não conformes, o servidor para o stream com `state.status = "compliance_blocked"` e notifica todos os clientes

---

### Story 3.6: Implementar o Audit Logger de Conformidade NCS

Como Bruno,
Eu quero que cada decisão de conformidade (aprovação ou rejeição) seja registrada em `./logs/compliance-audit.jsonl`,
Para que eu tenha uma trilha de auditoria defensável caso o canal receba um strike do YouTube.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o servidor está rodando e o diretório `./logs/` existe (criado automaticamente se ausente)
**When** uma faixa é aprovada para tocar (`valid === true`)
**Then** uma linha JSON é appendada: `{"timestamp":"ISO8601","level":"INFO","event":"track_play","trackId":"slug","status":"APPROVED","source":"ncs.io/..."}`
**When** uma faixa é rejeitada e pulada (`valid === false`)
**Then** uma linha JSON é appendada: `{"timestamp":"ISO8601","level":"WARNING","event":"compliance_skip","trackId":"slug","status":"REJECTED","reason":"not_in_whitelist"}`
**And** o arquivo é appendado em modo `a` para sobreviver a múltiplos restarts
**And** cada linha é um JSON válido e independente no formato JSONLines (não um array)
