#!/bin/bash
# install-vm-deps.sh
# Script de instalação de dependências para a Máquina Virtual (Ubuntu/Debian)

# Para a execução se algum comando falhar
set -e

echo "========================================"
echo " Atualizando repositórios..."
echo "========================================"
sudo apt-get update -y

echo "========================================"
echo " Instalando dependências básicas..."
echo "========================================"
sudo apt-get install -y curl wget gnupg ca-certificates

echo "========================================"
echo " Instalando Node.js 20.x e Yarn..."
echo "========================================"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g yarn

echo "========================================"
echo " Instalando FFmpeg..."
echo "========================================"
sudo apt-get install -y ffmpeg

echo "========================================"
echo " Instalando dependências do Puppeteer/Chrome..."
echo "========================================"
# Como o stream roda com headless: false, precisamos de um servidor X virtual (Xvfb)
# e diversas bibliotecas do sistema exigidas pelo Chrome.
sudo apt-get install -y \
  xvfb \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  libxshmfence1 \
  x11-xkb-utils \
  x11-utils \
  xfonts-100dpi \
  xfonts-75dpi \
  xfonts-scalable \
  xfonts-cyrillic \
  x11-apps \
  fonts-liberation \
  xdg-utils \
  libcups2 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxcb-dri3-0

echo "========================================"
echo " Instalando tmux, netcat (necessários para Autostart) e ufw..."
echo "========================================"
sudo apt-get install -y tmux netcat-openbsd ufw

echo "========================================"
echo " Configurando regras de Firewall (UFW)..."
echo "========================================"
sudo ufw allow 9003/tcp
sudo ufw allow 9004/tcp
sudo ufw reload
echo "Portas 9003 e 9004 liberadas."


echo "========================================"
echo " Configurando Autostart na inicialização da VM..."
echo "========================================"
cat << 'EOF' > autostart.sh
#!/bin/bash
source ~/.bashrc

cd /home/ubuntu/auraStream || exit 1

# Aguarda a rede e processos do sistema inicializarem (útil para o boot)
sleep 10

# Remove sessão anterior do tmux se existir
tmux kill-session -t aura 2>/dev/null

# Inicia uma nova sessão tmux em background rodando o start-build com login shell
tmux new-session -d -s aura 'bash -lc ./start-build.sh'

# Cria uma nova janela para o CLI
tmux new-window -t aura -n cli 'bash -l'

# Aguarda até que a porta 9003 (Backend WebSocket) esteja aberta
echo "Aguardando o backend iniciar na porta 9003..."
while ! nc -z localhost 9003; do
  sleep 2
done

# Tempo adicional para garantir que o Next.js e o backend estejam 100% prontos
sleep 5

# Envia o comando para rodar o yarn cli na janela do CLI
tmux send-keys -t aura:cli "yarn cli" Enter

# Aguarda o menu do CLI carregar
sleep 6

# Envia a tecla Enter para selecionar a primeira opção ('▶  Start Streaming')
tmux send-keys -t aura:cli Enter
EOF

echo "========================================"
echo " Concedendo permissão de execução aos scripts..."
echo "========================================"
chmod +x start-dev.sh start-build.sh install-vm-deps.sh autostart.sh

echo "========================================"
echo " Adicionando autostart.sh ao crontab..."
echo "========================================"
# Pega o caminho absoluto do diretório atual
CURRENT_DIR=$(pwd)
if ! crontab -l 2>/dev/null | grep -q "autostart.sh"; then
  (crontab -l 2>/dev/null; echo "@reboot $CURRENT_DIR/autostart.sh >> $CURRENT_DIR/logs/autostart.log 2>&1") | crontab -
  echo "✔ Autostart adicionado ao crontab com sucesso!"
else
  echo "✔ Autostart já estava configurado no crontab."
fi

echo "========================================"
echo " Instalando as dependências do projeto..."
echo "========================================"
yarn install

echo "================================================="
echo " Instalação concluída com sucesso!"
echo "================================================="
echo "IMPORTANTE:"
echo "Como a aplicação usa Puppeteer em modo 'headless: false' (necessário para gravação de áudio/vídeo da aba),"
echo "é obrigatório o uso do Xvfb na VM para emular um display."
echo ""
echo "Como iniciar o AuraStream v2.0 manualmente:"
echo "  ./start-dev.sh   (Para ambiente de desenvolvimento)"
echo "  ./start-build.sh (Para ambiente de produção)"
echo ""
echo "Nota: O script autostart.sh foi gerado e adicionado ao cron."
echo "Na próxima vez que a VM reiniciar, o projeto iniciará e fará o stream automaticamente!"
echo "Para monitorar o processo rodando no boot, use: tmux attach -t aura"
echo "================================================="
