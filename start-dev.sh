#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Iniciando AuraStream v2.0 (Modo Desenvolvimento)${NC}\n"

# Função para matar os processos filhos quando o script for interrompido
cleanup() {
    echo -e "\n${YELLOW}⚠️ Encerrando todos os serviços...${NC}"
    kill 0
}
trap cleanup EXIT

echo -e "${GREEN}[1/2] Iniciando Servidor WebSocket (Backend)...${NC}"
if [ -z "$DISPLAY" ] && command -v xvfb-run >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Sem DISPLAY detectado. Iniciando servidor com Xvfb (Virtual Framebuffer)...${NC}"
    xvfb-run -a --server-args="-screen 0 1920x1080x24" yarn server &
else
    yarn server &
fi
SERVER_PID=$!


echo -e "${GREEN}[2/2] Iniciando Next.js (Frontend)...${NC}"
yarn dev &
NEXT_PID=$!

echo -e "\n${CYAN}✅ Todos os serviços estão a correr!${NC}"
echo -e "   - Frontend: http://localhost:9002"
echo -e "   - Backend: ws://localhost:9003"

echo -e "\n${YELLOW}Pressiona Ctrl+C para encerrar todos os processos.${NC}\n"

# Aguardar pelos processos
wait
