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

echo -e "${GREEN}[1/3] Iniciando Servidor WebSocket (Backend)...${NC}"
yarn server &
SERVER_PID=$!

echo -e "${GREEN}[2/3] Iniciando Servidor Genkit (IA)...${NC}"
yarn genkit:dev &
GENKIT_PID=$!

echo -e "${GREEN}[3/3] Iniciando Next.js (Frontend)...${NC}"
yarn dev &
NEXT_PID=$!

echo -e "\n${CYAN}✅ Todos os serviços estão a correr!${NC}"
echo -e "   - Frontend: http://localhost:9002"
echo -e "   - Backend: ws://localhost:9003"
echo -e "   - Genkit: http://localhost:4000"
echo -e "\n${YELLOW}Pressiona Ctrl+C para encerrar todos os processos.${NC}\n"

# Aguardar pelos processos
wait
