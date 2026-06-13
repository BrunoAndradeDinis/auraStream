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
echo " Concedendo permissão de execução aos scripts..."
echo "========================================"
chmod +x start-dev.sh start-build.sh install-vm-deps.sh

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
echo "Como iniciar o AuraStream v2.0:"
echo "  ./start-dev.sh   (Para ambiente de desenvolvimento)"
echo "  ./start-build.sh (Para ambiente de produção)"
echo ""
echo "Nota: Estes scripts já vêm configurados para rodar o backend com xvfb-run automaticamente caso seja necessário."
echo ""
echo "Certifique-se de que o arquivo .env está configurado corretamente."
echo "================================================="
