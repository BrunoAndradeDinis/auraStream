# AuraStream v2.0

O AuraStream é um sistema de rádio automatizada 24/7 projetado para transmissões "lo-fi" ou de música contínua (estilo *Abyssal Aurora*). Ele funciona unindo um **Backend em Node.js (WebSockets e FFmpeg)**, uma interface de gestão **Next.js (Dashboard)** e uma view de renderização visual e sonora que é transmitida automaticamente para o YouTube.

O projeto incorpora também uma camada de **IA (Google Genkit + Gemini)** para gerar metadados e descrições automáticas das músicas.

## 🚀 Como Iniciar

1. Instala as dependências:
   ```bash
   npm install
   ```
2. Adiciona os teus ficheiros áudio `.mp3` à diretoria de entrada:
   ```bash
   src/assets/audio/
   ```
3. **Chave de API do Gemini:** Cria um ficheiro `.env` na raiz do teu projeto e insere a tua chave da Google AI:
   ```env
   GEMINI_API_KEY="tua-api-key-aqui"
   ```
4. Executa o ambiente completo de desenvolvimento usando o script global:
   ```bash
   ./start-dev.sh
   ```
   *(Este script inicializa os 3 servidores base num só clique: WebSockets, Genkit AI e Frontend Next.js)*

## 🌐 Como Iniciar a Transmissão para o YouTube

A transmissão **não inicia automaticamente** logo que corres o servidor (para não streamar inadvertidamente se ainda não tiveres a chave inserida). Para iniciares o envio de dados para o YouTube, segue estes passos:

1. Assim que rodares o `./start-dev.sh`, abre o painel de controlo em `http://localhost:9002/dashboard`.
2. Procura pelo cartão **Stream Config** no dashboard.
3. Insere a tua **YouTube Stream Key** na caixa de texto.
4. Após teres inserido a Stream Key no Dashboard, podes começar a transmitir clicando no botão de **Start Streaming** (se existir na interface de live status) **OU** podes abrir o teu terminal paralelo e correr:
   ```bash
   npm run cli
   ```
5. No menu interativo CLI que vai aparecer, seleciona a opção: `▶ Start Streaming`. 
A partir desse momento, o servidor capta o ecrã virtual (`http://localhost:9002/`) e o áudio sem precisares de usar OBS na tua máquina!

## 📡 Interfaces Disponíveis

- **Frontend / Player Renderizado (Stream View):** `http://localhost:9002/`
  Esta é a janela principal "Live". O Puppeteer capta esta exata janela visual e o som que dela emana para enviar para o YouTube. O áudio reproduz-se logo que a página é aberta e carregada.
- **Dashboard (Controlo e Gestão):** `http://localhost:9002/dashboard`
  Onde podes alterar configurações, reordenar a queue de ficheiros áudio arrastando (*Drag-and-Drop*), definir chaves de stream e ver estatísticas de conformidade (Compliance Logs).
- **CLI (Comando via Terminal):**
  A gestão remota é muito prática através da CLI (Comando: `npm run cli`). Por aqui podes pausar, começar a stream, ver logs, ou ativar timers para adormecer.

## 🛠 Arquitetura e Funcionalidades

### 1. Sistema de Reprodução
Quando os ficheiros `.mp3` são adicionados à diretoria `src/assets/audio`, o Backend valida se são permitidos. O player Frontend carrega o áudio, cruza os fades automaticamente (`useAudioEngine`) e informa o WebSocket da progressão. **Nota**: Porque foi passada uma política de bypass ao Puppeteer que grava a stream, o som flui naturalmente na stream para o YouTube sem ser retido pelos bloqueios standard de autoplay do Chrome. Contudo, se abrires tu mesmo o link principal num browser comum, terás de garantir que o browser permite reprodução, ou terás de interagir num ponto qualquer da janela.

### 2. Live Streaming Automático para o YouTube
O streaming é construído através de uma ponte `Puppeteer` -> `FFmpeg`:
- O comando `startStream(streamKey)` no servidor lança uma instância *headless* do browser focada no `http://localhost:9002`.
- O Puppeteer capta e grava esse separador e injeta num pipe.
- O FFmpeg (`libx264`) envia esse raw input de vídeo+áudio em formato RTMP direto para a Chave de Stream do teu YouTube, já devidamente otimizado para transmissões ao vivo.

### 3. Integração AI Automática (Descrições)
O AuraStream contacta o motor local da Google (`Genkit` rodando na porta 4000) de modo assíncrono para ler o nome do ficheiro MP3, criar uma "Vibe/Description" poética à volta da música e enviar essa descrição dinamicamente para aparecer em miniatura.

### 4. Auto-Shutdown (Encerramento Agendado)
No Dashboard (Sidebar) ou via `npm run cli`, podes ativar um "Auto-Shutdown". Ex: Podes mandar o rádio ir dormir em 2 horas. Ao final do tempo, o servidor encerra o FFmpeg "gracefully" sem corromper a stream do YouTube.

---

Para encerrar todo o sistema de uma só vez, clica simplesmente `Ctrl+C` no terminal de onde lançaste o `./start-dev.sh`.
