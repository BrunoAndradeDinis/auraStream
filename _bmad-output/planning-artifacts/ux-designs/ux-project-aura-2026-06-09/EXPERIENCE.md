---
status: working
updated: "2026-06-09"
---

# Foundation

O AuraStream UX baseia-se em uma interface desacoplada (Browser e CLI) com sincronização em tempo real via WebSocket. A UI primária (Dashboard) foca em Operação Confortável e Feedback Imediato, adotando padrões visuais do `DESIGN.md`.

## Information Architecture

### Dashboard de Operações (Web)
- **Left Sidebar**: Navegação fixa e Status Global do Sistema (Uptime, Live Status).
- **Área Central (Comfortable Density)**:
  - **Cards**: Padding generoso (ex: `24px`) e cantos `{rounded.large}`, proporcionando respiro entre configurações técnicas e controles da música.
  - **Configurações de Transmissão**: Controles de bitrate, resolução e gestão segura da Stream Key.
  - **Fila de Áudio (Audio Queue)**: Faixa atual em super destaque (com placeholder de waveform) + lista de próximas faixas ordenável (drag & drop).
- **Log Monitor**: Painel na base inferior. Tolera scroll, fonte monospace `{typography.mono}` para varredura rápida de erros ou status do sistema.

### MiniPlayer (Overlay de Transmissão)
- **Comportamento**: Estritamente de exibição. "Passivo" no frontend, servindo como assinatura visual do canal de rádio no YouTube.

## Component Patterns & Motion

- **Motion Fluido (Glassy)**:
  - **Fundo / Background**: O Dashboard compartilha a animação em Canvas da Aurora Boreal do MiniPlayer, mas muito mais sutil (opacidade baixa), adicionando um "Premium feel" vivo à tela.
  - **Transições de UI**: Interações em botões e menus utilizam `ease-in-out` de ~200ms a 300ms, evitando cortes secos típicos de terminais.
  - **Entradas e Saídas**: Toasts e painéis de aviso (ex: "Compliance Warning") entram com um suave `slide-up` + `fade-in`.
- **Painéis Translúcidos (Glassmorphism)**: Os blocos da interface possuem fundos translúcidos (ex: `rgba(2, 6, 23, 0.7)`) com efeito `backdrop-blur`, contrastando lindamente com o fundo True Black (`{colors.background}`).

## Key Flows

### Flow: Reordenando a Transmissão ao Vivo
**Protagonista**: Bruno (The Operator)
1. Bruno percebe que a próxima música da fila não se encaixa na vibe atual. Ele clica e segura o card da faixa número 3 na área de *Audio Queue*.
2. O card eleva sutilmente (sombra ajustada e leve aumento de escala, transition de 200ms) indicando que pode ser movido.
3. Bruno arrasta o card para a posição número 1 e o solta. O card assenta com um movimento de `ease-out`.
4. Um Toast translúcido com brilho Cyan (`{colors.primary}`) desliza no canto inferior direito confirmando "Queue Updated", enquanto o WebSocket sincroniza os dados no backend silenciosamente.
