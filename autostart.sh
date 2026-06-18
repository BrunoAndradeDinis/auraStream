#!/bin/bash
source ~/.bashrc

cd /home/ubuntu/auraStream || exit 1

# Aguarda a rede e processos do sistema inicializarem (útil para o boot)
echo "Aguardando conectividade de rede para iniciar..."
while ! curl -s --head --request GET https://br-se1.magaluobjects.com > /dev/null; do
  sleep 2
done
echo "Rede disponível! Iniciando..."
sleep 2

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

