# Story 4.12: Implementar Glassmorphism nos Painéis e Motion Fluido nos Botões

## Metadados

| Campo             | Valor                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| **Story ID**      | 4.12                                                                               |
| **Story Key**     | 4-12-implementar-glassmorphism-nos-paineis-e-motion-fluido                         |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                       |
| **Status**        | ready-for-dev                                                                      |
| **Esforço Est.**  | ~3h                                                                                |
| **Depende de**    | Story 4.1 (design tokens), Story 4.2 (layout)                                     |

---

## User Story

> **Como** Bruno,
> **Eu quero** que todos os cards do Dashboard tenham o efeito glassmorphism e que os botões usem transições fluidas de 200ms.

---

## Acceptance Criteria (BDD)

### AC1 — Glassmorphism nos cards
```gherkin
Given qualquer card ou painel do Dashboard está visível
When o componente renderiza
Then fundo do card é `rgba(2, 6, 23, 0.70)` com `backdrop-filter: blur(12px)`
And borda `1px solid rgba(0, 240, 255, 0.1)` e `border-radius: 16px`
```

### AC2 — Hover nos botões (200ms)
```gherkin
When Bruno passa o cursor sobre um botão de ação
Then transição de cor de fundo ocorre em `200ms ease-in-out` sem salto visual
```

### AC3 — Click feedback nos botões
```gherkin
When Bruno clica em qualquer botão
Then `transform: scale(0.96)` de 100ms indica pressed
And reverte em 150ms
```

---

## Contexto para o Agente de Desenvolvimento

### Classes CSS Globais (consolidar em `globals.css`)

Esta story consolida e padroniza o que as stories anteriores já começaram a definir individualmente:

```css
/* Glassmorphism Card */
.glass-card {
  background: rgba(2, 6, 23, 0.70);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 16px;
  padding: var(--padding-comfortable, 24px);
}

/* Botão primário com motion fluido */
.btn-primary {
  background: var(--color-primary);
  color: #000000;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  transition: background 200ms ease-in-out, transform 100ms ease-out;
}

.btn-primary:hover {
  background: rgba(0, 240, 255, 0.8);
}

.btn-primary:active {
  transform: scale(0.96);
  transition: transform 100ms ease-out;
}

/* Botão secundário */
.btn-secondary {
  background: rgba(124, 58, 237, 0.2);
  color: var(--color-secondary);
  border: 1px solid rgba(124, 58, 237, 0.4);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 200ms ease-in-out, transform 100ms ease-out;
}

.btn-secondary:hover {
  background: rgba(124, 58, 237, 0.35);
}

.btn-secondary:active {
  transform: scale(0.96);
}
```

### Aplicação Retroativa

Verificar todas as stories anteriores (4.3 a 4.10) e garantir que os cards usam `.glass-card` e os botões usam `.btn-primary` ou `.btn-secondary`. Fazer as substituições inline styles → classes CSS onde aplicável.

### Regras Críticas

1. **`-webkit-backdrop-filter`** — necessário para Safari/WebKit compatibility.
2. **Não usar Tailwind** para glassmorphism — as variáveis CSS customizadas do Abyssal Aurora não são classes Tailwind padrão.
3. **`transition` deve incluir `transform`** nos botões para o efeito de scale ao clicar.

---

## Checklist de Implementação

- [x] Consolidar `.glass-card`, `.btn-primary`, `.btn-secondary` em `globals.css`
- [x] Aplicar classes nos cards das stories 4.3 a 4.10
- [x] Verificar: glassmorphism visível com blur sobre o canvas da Aurora (Story 4.9)
- [x] Verificar: hover nos botões → transição 200ms
- [x] Verificar: click nos botões → scale(0.96) e reversão

---

## Dev Agent Record

### Implementation Notes
- Unificado layout das `glass-card` em `globals.css` para centralizar a alteração do opacity e blur de forma padronizada.
- Aplicado `-webkit-backdrop-filter` default.
- Classes dos botões re-utilizadas no LogMonitor e StreamConfig.

### Completion Notes
✅ Story 4.12 completada com estilo premium uniforme.

### Change Log
- 2026-06-11: Classes globais glassmorphism injetadas.

---

## Status

**Status:** review
