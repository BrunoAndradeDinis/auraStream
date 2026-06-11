# Story 4.9: Implementar o Aurora Boreal Canvas Atenuado no Background do Dashboard

## Metadados

| Campo             | Valor                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| **Story ID**      | 4.9                                                                                |
| **Story Key**     | 4-9-implementar-o-aurora-boreal-canvas-atenuado-no-background                      |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                       |
| **Status**        | ready-for-dev                                                                      |
| **Esforço Est.**  | ~4h                                                                                |
| **Depende de**    | Story 4.2 (layout com z-index correto)                                             |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o fundo do Dashboard exiba a animação de Aurora Boreal com opacidade muito reduzida,
> **Para que** a interface tenha o "premium feel" sem interferir na leitura das informações.

---

## Acceptance Criteria (BDD)

### AC1 — Canvas de fundo animado
```gherkin
Given o Dashboard está aberto
When a página renderiza
Then `<canvas>` em `position: fixed`, `z-index: 0` ocupa 100% da viewport
And ondas suaves de Cyan #00F0FF e Roxo #7C3AED animam a 30fps
And consumindo no máximo 15% de CPU em 2 vCPUs
And opacidade do canvas é `0.12`
```

### AC2 — Painéis sobre o canvas
```gherkin
Then painéis têm `position: relative; z-index: 1` garantindo sobreposição correta
```

### AC3 — Pausa ao perder foco
```gherkin
When a aba perde foco (visibilitychange)
Then a animação pausa via `document.hidden` check
```

---

## Contexto para o Agente de Desenvolvimento

### Componente Existente

O projeto já tem `src/components/streaming/AuroraBackground.tsx` — verificar antes de criar um novo. Adaptar ou reutilizar o componente existente se ele já implementa a animação de aurora.

### Algoritmo de Aurora (caso não exista)

```typescript
// Usar perlin noise ou simplex noise para ondas suaves
// Alternativa simples: múltiplos círculos gradientes animados com requestAnimationFrame

function drawAurora(ctx: CanvasRenderingContext2D, t: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Onda Cyan
  const gradCyan = ctx.createRadialGradient(
    ctx.canvas.width * (0.3 + 0.1 * Math.sin(t * 0.0005)),
    ctx.canvas.height * 0.4,
    0,
    ctx.canvas.width * 0.5, ctx.canvas.height * 0.5,
    ctx.canvas.width * 0.6
  );
  gradCyan.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
  gradCyan.addColorStop(1, 'transparent');
  ctx.fillStyle = gradCyan;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Onda Roxo
  const gradPurple = ctx.createRadialGradient(
    ctx.canvas.width * (0.7 + 0.05 * Math.cos(t * 0.0007)),
    ctx.canvas.height * 0.6,
    0,
    ctx.canvas.width * 0.5, ctx.canvas.height * 0.5,
    ctx.canvas.width * 0.5
  );
  gradPurple.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
  gradPurple.addColorStop(1, 'transparent');
  ctx.fillStyle = gradPurple;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

### Controle de FPS (30fps)

```typescript
let lastFrame = 0;
const FPS = 30;
const INTERVAL = 1000 / FPS;

function animate(timestamp: number) {
  if (document.hidden) return requestAnimationFrame(animate);
  if (timestamp - lastFrame < INTERVAL) return requestAnimationFrame(animate);
  lastFrame = timestamp;
  drawAurora(ctx, timestamp);
  requestAnimationFrame(animate);
}
```

### Regras Críticas

1. **`z-index: 0`** no canvas, **`z-index: 1`** nos painéis — definido na Story 4.2.
2. **`opacity: 0.12`** — aplicar via CSS no elemento `<canvas>` para atenuar a aurora.
3. **`visibilitychange`** — pausar animação quando `document.hidden === true`.
4. **30fps cap** — não usar `requestAnimationFrame` sem throttle (o browser roda a 60fps por padrão).
5. **`will-change: transform`** — não aplicar ao canvas (causa problema de compositing). Deixar o canvas como está.

---

## Checklist de Implementação

- [ ] Verificar se `AuroraBackground.tsx` existente pode ser adaptado
- [ ] Implementar animação de aurora com gradientes Cyan + Roxo
- [ ] Aplicar `opacity: 0.12` no canvas via CSS
- [ ] Implementar throttle a 30fps
- [ ] Implementar pausa via `visibilitychange`
- [ ] Verificar: canvas atrás de todos os painéis (z-index correto)
- [ ] Verificar: CPU ≤ 15% em benchmark simples

---

## Status

**Status:** ready-for-dev
