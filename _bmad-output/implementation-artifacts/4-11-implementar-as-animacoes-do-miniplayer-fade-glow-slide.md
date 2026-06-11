# Story 4.11: Implementar as Animações do MiniPlayer (Fade-in, Glow Pulse, Slide-up)

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 4.11                                                                           |
| **Story Key**     | 4-11-implementar-as-animacoes-do-miniplayer-fade-glow-slide                    |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                   |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~3h                                                                            |
| **Depende de**    | Story 4.10 (MiniPlayer estrutura)                                              |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o MiniPlayer anime suavemente ao aparecer e exiba um pulso de brilho na borda superior a cada 3s.

---

## Acceptance Criteria (BDD)

### AC1 — Entrada do MiniPlayer
```gherkin
Given nova faixa começa e MiniPlayer é montado
When componente aparece pela primeira vez
Then executa `slide-up` de `translateY(20px) → translateY(0)` + `opacity: 0 → 1` em 300ms `ease-out`
```

### AC2 — Troca de faixa
```gherkin
When a faixa muda para próxima
Then conteúdo faz `fade-out` de 200ms e depois `fade-in` de 300ms com novos dados
```

### AC3 — Glow pulse na borda
```gherkin
Then borda superior #7C3AED executa `glow pulse` via `@keyframes`
  De: `box-shadow: 0 -2px 8px rgba(124, 58, 237, 0.4)`
  Para: `box-shadow: 0 -2px 20px rgba(124, 58, 237, 0.9)`
  A cada 3s `ease-in-out` (infinite)
```

### AC4 — GPU acceleration
```gherkin
Then todas as animações usam `will-change: transform, opacity`
```

---

## Contexto para o Agente de Desenvolvimento

### CSS Animations (adicionar em `globals.css`)

```css
@keyframes miniplayer-enter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 -2px 8px rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 -2px 20px rgba(124, 58, 237, 0.9); }
}

.miniplayer-enter {
  animation: miniplayer-enter 300ms ease-out forwards;
  will-change: transform, opacity;
}

.miniplayer-glow {
  animation: glow-pulse 3s ease-in-out infinite;
}
```

### Lógica de Fade na Troca de Faixa

No `MiniPlayer.tsx`, usar `useEffect` para detectar mudança de `currentTrack` e aplicar fade out → in:

```tsx
const [isVisible, setIsVisible] = useState(false);
const [displayTrack, setDisplayTrack] = useState(currentTrack);

useEffect(() => {
  if (!currentTrack) return;
  // Fade out
  setIsVisible(false);
  setTimeout(() => {
    setDisplayTrack(currentTrack);
    setIsVisible(true); // Fade in
  }, 200);
}, [currentTrack?.id]);
```

### Regras Críticas

1. **`will-change: transform, opacity`** — aplicar apenas nos elementos que animam (não no container raiz).
2. **`glow-pulse` na borda** — implementar via `animation` no próprio elemento MiniPlayer ou via pseudo-elemento `::before`.
3. **Fade de 200ms out + 300ms in** — usar `setTimeout` de 200ms para troca de dados entre as animações.

---

## Checklist de Implementação

- [x] Adicionar `@keyframes miniplayer-enter` e `glow-pulse` no `globals.css`
- [x] Aplicar `.miniplayer-enter` na montagem do componente
- [x] Implementar fade out/in na troca de faixa com `setTimeout`
- [x] Aplicar `.miniplayer-glow` para o pulso de brilho a cada 3s
- [x] Verificar: slide-up visível ao montar
- [x] Verificar: fade out → in ao trocar faixa
- [x] Verificar: glow pulsante na borda superior

---

## Dev Agent Record

### Implementation Notes
- Adicionado state local para debounce das informações em `MiniPlayer.tsx`, utilizando o hook `useEffect` e o timeout de 200ms para causar a illusão de fade in / out smooth.
- Classes CSS encarregues de providenciar keyframes via hardware accelerated will-change.

### Completion Notes
✅ Story 4.11 completa. Miniplayer totalmente animado.

### Change Log
- 2026-06-11: Efeitos e keyframes acoplados no overlay.

---

## Status

**Status:** review
