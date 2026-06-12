#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Iniciando AuraStream v2.0 (Modo Produção/Build)${NC}\n"

echo -e "${GREEN}[1/4] Realizando Build do Projeto...${NC}"
yarn build
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Erro durante o build. Abortando inicialização.${NC}"
    exit 1
fi

# Função para matar os processos filhos quando o script for interrompido
cleanup() {
    echo -e "\n${YELLOW}⚠️ Encerrando todos os serviços...${NC}"
    kill 0
}
trap cleanup EXIT

echo -e "${GREEN}[2/4] Iniciando Servidor WebSocket (Backend)...${NC}"
if [ -z "$DISPLAY" ] && command -v xvfb-run >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Sem DISPLAY detectado. Iniciando servidor com Xvfb (Virtual Framebuffer)...${NC}"
    xvfb-run -a --server-args="-screen 0 1920x1080x24" yarn server &
else
    yarn server &
fi
SERVER_PID=$!

echo -e "${GREEN}[3/4] Iniciando Servidor Genkit (IA)...${NC}"
yarn genkit:dev &
GENKIT_PID=$!

echo -e "${GREEN}[4/4] Iniciando Next.js (Frontend Buildado)...${NC}"
yarn start &
NEXT_PID=$!

echo -e "\n${CYAN}✅ Todos os serviços estão a correr de forma otimizada!${NC}"
echo -e "   - Frontend (Produção): http://localhost:9002"
echo -e "   - Backend: ws://localhost:9003"
echo -e "   - Genkit: http://localhost:4000"
echo -e "\n${YELLOW}Pressiona Ctrl+C para encerrar todos os processos.${NC}\n"

# Aguardar pelos processos
wait
