---
stepsCompleted: [1, 2, 3, 4]
status: complete
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

---

## Epic 4: Interface Visual — Dashboard e MiniPlayer Cinematic

Bruno tem acesso a um Dashboard elegante (Abyssal Aurora, glassmorphism) para monitorar a transmissão, reordenar a fila via drag-drop e verificar compliance. Os espectadores do YouTube veem o MiniPlayer cinematic com Aurora Boreal animada.

**FRs cobertos:** FR5, FR6, NFR3, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7

### Story 4.1: Configurar Design System Abyssal Aurora (Tokens CSS + Fontes)

Como Bruno,
Eu quero que as variáveis CSS do tema Abyssal Aurora e as fontes `Outfit` e `JetBrains Mono` estejam definidas globalmente,
Para que todos os componentes usem o mesmo sistema visual sem inconsistências.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o arquivo `src/app/globals.css` existe no projeto Next.js
**When** a página é carregada no browser
**Then** as variáveis CSS estão disponíveis globalmente: `--color-bg: #000000`, `--color-surface: #020617`, `--color-primary: #00F0FF`, `--color-secondary: #7C3AED`, `--color-text: #FFFFFF`, `--color-muted: #94A3B8`
**And** as fontes `Outfit` e `JetBrains Mono` estão importadas via Google Fonts no `layout.tsx`
**And** `Outfit` está aplicada como `font-family` padrão do `body`
**And** a classe `.font-mono` aplica `JetBrains Mono` a qualquer elemento filho

---

### Story 4.2: Criar o Layout Base do Dashboard (Sidebar + Área Central)

Como Bruno,
Eu quero que o Dashboard tenha uma sidebar fixa à esquerda e uma área central scrollável com padding confortável,
Para que a interface de operação esteja estruturalmente organizada antes de qualquer funcionalidade ser adicionada.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** Bruno acessa `http://localhost:9002/dashboard`
**When** a página renderiza
**Then** uma sidebar fixa de `240px` é exibida à esquerda com fundo `rgba(2, 6, 23, 0.95)` e borda direita `1px solid rgba(0, 240, 255, 0.15)`
**And** a área central ocupa o restante com `padding: 24px`, fundo `var(--color-bg)` e scroll vertical independente da sidebar
**And** em telas menores que `768px` a sidebar se colapsa para um ícone de hamburguer
**And** a fonte base é `Outfit` e dados técnicos (uptime, timestamps) usam `JetBrains Mono`

---

### Story 4.3: Implementar o Card de Live Status e Uptime na Sidebar

Como Bruno,
Eu quero que a sidebar exiba o status atual da transmissão com indicador colorido e contador de uptime,
Para que eu saiba instantaneamente o estado da live ao olhar para o Dashboard.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o Dashboard está aberto e conectado ao WebSocket
**When** `state.status === "streaming"`
**Then** um ponto verde pulsante e o texto `● LIVE` em Cyan são exibidos com contador `HH:MM:SS` incrementando em tempo real
**When** `state.status === "reconnecting"`
**Then** ponto amarelo piscante e texto `● RECONNECTING` são exibidos
**When** `state.status === "idle"` ou `"offline"`
**Then** ponto vermelho estático e texto `● OFFLINE` são exibidos
**And** transições entre estados usam `ease-in-out` de 300ms sem flash visual

---

### Story 4.4: Implementar o Card de Configurações de Stream

Como Bruno,
Eu quero um card com os controles de Stream Key mascarado, bitrate e resolução na área central,
Para que eu configure a transmissão diretamente pelo Dashboard sem usar a CLI.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o card "Stream Config" está visível na área central
**When** Bruno clica no campo de Stream Key
**Then** o input do tipo `password` exibe apenas `●●●●●●●●` ao digitar, nunca o texto em claro
**And** ao confirmar, o Dashboard envia `{ "event": "config:stream_key", "payload": "..." }` via WebSocket
**And** um slider de bitrate de `1500` a `8000` kbps com valor padrão `3500` exibe o valor atual em `JetBrains Mono`
**And** um dropdown de resolução com opções `1080p`, `720p`, `480p` está disponível
**And** nenhum valor de Stream Key é logado no console do browser

---

### Story 4.5: Implementar a Seção de Fila — Faixa Atual em Destaque

Como Bruno,
Eu quero que a faixa em reprodução seja exibida com destaque máximo na área central,
Para que eu identifique de relance qual música está sendo transmitida agora.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o Dashboard está conectado e `state.currentTrack` não é null
**When** a seção "Now Playing" renderiza
**Then** são exibidos: título em `Outfit` bold 20px `#FFFFFF`, artista 14px `#94A3B8`, e uma barra de progresso animada em Cyan como waveform placeholder
**And** borda sutil `2px solid var(--color-primary)` contorna o card com `box-shadow: 0 0 12px rgba(0, 240, 255, 0.3)`
**When** `state.currentTrack === null`
**Then** é exibida a mensagem `No tracks in queue — add .mp3 files to ./src/assets/audio/` em `#94A3B8`

---

### Story 4.6: Implementar a Lista de Próximas Faixas com Drag-and-Drop

Como Bruno,
Eu quero que as próximas faixas da fila sejam listadas em cards reordenáveis via drag-and-drop,
Para que eu reorganize a ordem de reprodução diretamente no Dashboard.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** `state.queue` tem mais de uma faixa além da `currentTrack`
**When** Bruno clica e segura um card de faixa
**Then** o card eleva-se com `transform: scale(1.02)` e `box-shadow` ampliado em `ease-out` de 200ms
**When** Bruno solta o card em uma nova posição
**Then** o card assenta com `ease-out` de 200ms e o Dashboard envia `{ "event": "queue:reorder", "payload": { "newOrder": [...ids] } }` via WebSocket
**And** um Toast translúcido com `slide-up` + `fade-in` de 300ms aparece no canto inferior direito: `✓ Queue updated`
**And** o Toast desaparece automaticamente após 3s com `fade-out`
**And** a reordenação é refletida imediatamente na UI sem esperar resposta do servidor

---

### Story 4.7: Implementar o Log Monitor no Painel Inferior

Como Bruno,
Eu quero um painel de logs exibindo as últimas 20 ações do sistema em tempo real,
Para que eu monitore eventos de compliance, mudanças de faixa e erros sem consultar arquivos.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** o Dashboard está conectado ao WebSocket
**When** qualquer evento relevante ocorre no servidor
**Then** uma nova linha é adicionada ao topo com timestamp em `JetBrains Mono` e ícone colorido (`✅` INFO, `⚠️` WARNING, `❌` ERROR)
**And** o painel mantém no máximo 20 linhas, removendo a mais antiga ao adicionar nova
**And** o painel tem scroll vertical interno e um botão `Clear` que limpa as entradas localmente
**And** linhas de compliance skip são destacadas em amarelo âmbar

---

### Story 4.8: Implementar o Widget de Status de Compliance NCS

Como Bruno,
Eu quero um card de "Compliance Status" mostrando o estado geral da whitelist NCS,
Para que eu saiba se alguma faixa está bloqueada antes de iniciar a live.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o Dashboard está carregado e o estado de compliance foi calculado
**When** todas as faixas da fila passam na validação NCS
**Then** o card exibe `✅ All tracks verified` com borda e ícone em verde `#10B981`
**When** há faixas com falha
**Then** o card exibe `⚠️ N tracks unverified` em amarelo com lista dos títulos faltantes
**When** `state.status === "compliance_blocked"`
**Then** o card exibe `❌ BLOCKED: Non-NCS source detected` em vermelho com nome da faixa e link `Fix Now → compliance guide`
**And** transições de estado usam `ease-in-out` de 300ms

---

### Story 4.9: Implementar o Aurora Boreal Canvas Atenuado no Background do Dashboard

Como Bruno,
Eu quero que o fundo do Dashboard exiba a animação de Aurora Boreal com opacidade muito reduzida,
Para que a interface tenha o "premium feel" da aurora sem interferir na leitura das informações.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** o Dashboard está aberto no browser
**When** a página renderiza
**Then** um `<canvas>` em `position: fixed`, `z-index: 0` ocupa 100% da viewport por trás de todos os painéis
**And** ondas suaves de Cyan `#00F0FF` e Roxo `#7C3AED` animam a 30fps consumindo no máximo 15% de CPU em 2 vCPUs
**And** a opacidade do canvas é `0.12` para não competir com o texto dos painéis
**And** os painéis têm `position: relative; z-index: 1` garantindo sobreposição correta
**And** a animação pausa via `visibilitychange` event quando a aba perde foco

---

### Story 4.10: Criar o Componente MiniPlayer — Estrutura e Dados

Como Bruno,
Eu quero que `src/components/streaming/MiniPlayer.tsx` exiba título, artista, gênero e descrição da faixa em overlay fixo no canto inferior direito,
Para que os espectadores do YouTube vejam as informações da música durante a transmissão.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** a página compositora (`/`) está carregada e `state.currentTrack` não é null
**When** o componente MiniPlayer renderiza
**Then** é posicionado `fixed bottom-5 right-5` com dimensões `280px × 140px`
**And** exibe: título em `Outfit` 14px bold `#FFFFFF`, artista `Inter` 12px `#94A3B8`, gênero 10px `#7C3AED`, descrição 9px italic `#94A3B8` truncada em 2 linhas
**And** fundo `rgba(2, 6, 23, 0.85)` com `backdrop-blur: 8px` e borda superior `2px solid #7C3AED`
**And** o componente não responde a cliques nem hover (passivo, display-only)
**And** quando `state.currentTrack === null`, o MiniPlayer retorna `null` e não é renderizado

---

### Story 4.11: Implementar as Animações do MiniPlayer (Fade-in, Glow Pulse, Slide-up)

Como Bruno,
Eu quero que o MiniPlayer anime suavemente ao aparecer e exiba um pulso de brilho na borda superior a cada 3s,
Para que a experiência visual do canal tenha a qualidade "cinematic" planejada.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** uma nova faixa começa e o MiniPlayer é montado
**When** o componente aparece pela primeira vez
**Then** executa `slide-up` de `translateY(20px) → translateY(0)` + `opacity: 0 → 1` em 300ms `ease-out`
**When** a faixa muda para a próxima
**Then** o conteúdo faz `fade-out` de 200ms e depois `fade-in` de 300ms com os novos dados
**And** a borda superior `#7C3AED` executa `glow pulse` via `@keyframes` — de `box-shadow: 0 -2px 8px rgba(124, 58, 237, 0.4)` para `0 -2px 20px rgba(124, 58, 237, 0.9)` — a cada 3s `ease-in-out`
**And** todas as animações usam `will-change: transform, opacity` para aceleração de GPU

---

### Story 4.12: Implementar Glassmorphism nos Painéis e Motion Fluido nos Botões

Como Bruno,
Eu quero que todos os cards do Dashboard tenham o efeito glassmorphism e que os botões usem transições fluidas de 200ms,
Para que a interface tenha coerência visual premium em todas as interações.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** qualquer card ou painel do Dashboard está visível
**When** o componente renderiza
**Then** o fundo do card é `rgba(2, 6, 23, 0.70)` com `backdrop-filter: blur(12px)` e borda `1px solid rgba(0, 240, 255, 0.1)` e `border-radius: 16px`
**When** Bruno passa o cursor sobre um botão de ação (Play, Skip, Stop)
**Then** a transição de cor de fundo ocorre em `200ms ease-in-out` sem salto visual
**When** Bruno clica em qualquer botão
**Then** `transform: scale(0.96)` de 100ms indica o estado pressed antes de reverter em 150ms

---

### Story 4.13: Conectar o Dashboard ao WebSocket e Sincronizar Estado em Tempo Real

Como Bruno,
Eu quero que o Dashboard se conecte automaticamente ao WebSocket e reflita qualquer mudança de estado em menos de 100ms,
Para que a interface web e a CLI estejam sempre em sincronia.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** o servidor WebSocket está rodando em `ws://localhost:9003` e Bruno acessa o Dashboard
**When** a página monta
**Then** um hook `useWebSocket` conecta ao servidor e recebe o `server:state_sync` inicial populando o estado React em menos de 100ms
**And** eventos subsequentes (`server:state_sync`, `server:compliance_skip`, `server:stream_failed`) atualizam apenas os componentes afetados sem re-render completo
**When** o servidor fica indisponível
**Then** o Dashboard exibe banner `⚠️ Connection lost — retrying...` e tenta reconectar a cada 3s
**And** quando a conexão é restaurada, o banner desaparece e o estado é sincronizado com o snapshot atual

---

## Epic 5: Automação e Descrições via IA *(Opcional)*

Bruno pode agendar o encerramento automático da transmissão com preset de tempo e as músicas exibem descrições poéticas geradas pelo Genkit no MiniPlayer.

**FRs cobertos:** FR10, FR6 (aiDescription)

### Story 5.1: Implementar a Geração de Descrições via Genkit (Batch por Faixa)

Como Bruno,
Eu quero que o servidor gere automaticamente uma descrição poética para cada faixa nova usando o Genkit/Gemini,
Para que o MiniPlayer exiba textos evocativos que enriqueçam a experiência dos espectadores.

**Esforço estimado:** ~4h

**Acceptance Criteria:**

**Given** uma faixa entra na fila e não possui campo `aiDescription` nos seus metadados
**When** o servidor a detecta
**Then** `server/ai-description.ts` chama o Genkit com o prompt: `"Generate a 2-line poetic description (max 120 chars) for a song titled '{title}' by {artist}, genre: {genre}. Write in English, atmospheric and evocative."`
**And** a resposta é salva em `state.queue[i].aiDescription` e persistida em memória
**And** se o Genkit retornar erro, `aiDescription` fica como `null` e o MiniPlayer omite a linha de descrição sem crash
**And** a geração ocorre em background sem bloquear a fila nem a reprodução
**And** a latência máxima tolerada é de 5s por faixa — se ultrapassar, cancela e usa `null`

---

### Story 5.2: Exibir a Descrição IA no MiniPlayer

Como Bruno,
Eu quero que o MiniPlayer exiba a `aiDescription` gerada abaixo do gênero da faixa,
Para que os espectadores tenham uma camada extra de profundidade narrativa sobre a música.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** `state.currentTrack.aiDescription` não é null
**When** o MiniPlayer renderiza
**Then** a descrição é exibida em `Inter` 9px italic `#94A3B8`, limitada a 2 linhas com `overflow: hidden; text-overflow: ellipsis; -webkit-line-clamp: 2`
**Given** `state.currentTrack.aiDescription === null`
**When** o MiniPlayer renderiza
**Then** a linha de descrição é omitida e o layout se ajusta verticalmente sem espaço vazio

---

### Story 5.3: Implementar o Auto-Shutdown Timer no Servidor

Como Bruno,
Eu quero configurar um timer de encerramento automático da transmissão com presets de tempo,
Para que eu inicie uma sessão de rádio e confie que ela encerrará no horário correto sem supervisão.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** Bruno seleciona "Set Auto-Shutdown" na CLI e escolhe um preset (ex: "2 hours")
**When** o preset é confirmado
**Then** o servidor armazena `state.shutdownAt = Date.now() + durationMs` e emite broadcast com o timestamp alvo
**And** o servidor calcula um timer secundário para `shutdownAt - 5min` que emite `{ "event": "server:shutdown_warning", "payload": { "minutesLeft": 5 } }`
**And** um `setInterval` de 1s atualiza `state.shutdownCountdown` com os segundos restantes
**And** a precisão do encerramento é de ±5s em relação ao horário agendado

---

### Story 5.4: Implementar a Sequência de Encerramento Graceful do Auto-Shutdown

Como Bruno,
Eu quero que o Auto-Shutdown execute uma sequência ordenada de ações ao atingir o tempo limite,
Para que o stream encerre de forma limpa sem deixar o canal do YouTube em estado indeterminado.

**Esforço estimado:** ~3h

**Acceptance Criteria:**

**Given** o timer de auto-shutdown atingiu `state.shutdownAt`
**When** o encerramento é disparado
**Then** a sequência executa nesta ordem: (1) emite `media:pause`, (2) aguarda 5s, (3) emite `media:stop_stream`, (4) loga `[shutdown] Scheduled shutdown at HH:MM` no `compliance-audit.jsonl`, (5) atualiza `state.status` para `"idle"`
**And** o timer é cancelado automaticamente após a execução
**And** se cancelado pelo evento `{ "event": "timer:cancel" }` antes do disparo, nenhuma ação de encerramento é executada e `state.shutdownAt` é zerado

---

### Story 5.5: Exibir Countdown de Auto-Shutdown na CLI e no Dashboard

Como Bruno,
Eu quero que ambas as interfaces exibam o tempo restante para o auto-shutdown,
Para que eu saiba quando a sessão vai encerrar sem fazer cálculos manualmente.

**Esforço estimado:** ~2h

**Acceptance Criteria:**

**Given** `state.shutdownAt` não é null e o countdown está ativo
**When** a CLI exibe o status
**Then** uma linha `⏱ Auto-shutdown in: HH:MM:SS` é exibida em `JetBrains Mono` Cyan
**When** o Dashboard está aberto
**Then** um badge `⏱ HH:MM:SS` é exibido na sidebar próximo ao Live Status, atualizando a cada segundo
**When** `state.shutdownAt === null`
**Then** nenhum countdown é exibido em nenhuma interface
**And** o aviso de 5min exibe um toast na UI com texto `⚠️ Stream shutting down in 5 minutes`
