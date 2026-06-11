# Story 4.1: Configurar Design System Abyssal Aurora (Tokens CSS + Fontes)

## Metadados

| Campo             | Valor                                                                              |
|-------------------|------------------------------------------------------------------------------------|
| **Story ID**      | 4.1                                                                                |
| **Story Key**     | 4-1-configurar-design-system-abyssal-aurora-tokens-css-fontes                      |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                       |
| **Status**        | ready-for-dev                                                                      |
| **Esforço Est.**  | ~2h                                                                                |
| **Depende de**    | Nenhuma (frontend independente das stories de backend)                             |

---

## User Story

> **Como** Bruno,
> **Eu quero** que as variáveis CSS do tema Abyssal Aurora e as fontes `Outfit` e `JetBrains Mono` estejam definidas globalmente,
> **Para que** todos os componentes usem o mesmo sistema visual sem inconsistências.

---

## Acceptance Criteria (BDD)

### AC1 — Variáveis CSS globais disponíveis
```gherkin
Given o arquivo `src/app/globals.css` existe no projeto Next.js
When a página é carregada no browser
Then as variáveis CSS estão disponíveis globalmente:
  --color-bg: #000000
  --color-surface: #020617
  --color-primary: #00F0FF
  --color-secondary: #7C3AED
  --color-text: #FFFFFF
  --color-muted: #94A3B8
```

### AC2 — Fontes importadas e aplicadas
```gherkin
When a página carrega
Then `Outfit` e `JetBrains Mono` estão importadas via Google Fonts no `layout.tsx`
And `Outfit` é o `font-family` padrão do `body`
And a classe `.font-mono` aplica `JetBrains Mono` a qualquer elemento filho
```

---

## Contexto para o Agente de Desenvolvimento

### Estado Atual do `globals.css`

O projeto já tem um `globals.css` com variáveis HSL do Shadcn/UI. **Adicionar** as variáveis do Abyssal Aurora sem remover as existentes do Shadcn (que são necessárias para os componentes Radix).

### Implementação

**`src/app/globals.css`** — adicionar no `:root`:
```css
:root {
  /* Abyssal Aurora Design System */
  --color-bg: #000000;
  --color-surface: #020617;
  --color-primary: #00F0FF;
  --color-secondary: #7C3AED;
  --color-text: #FFFFFF;
  --color-muted: #94A3B8;
  --color-border: rgba(0, 240, 255, 0.15);
  --rounded-large: 16px;
  --padding-comfortable: 24px;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

**`src/app/layout.tsx`** — adicionar imports de fonte:
```typescript
import { Outfit, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

// No body: className={`${outfit.variable} ${jetbrainsMono.variable}`}
// No globals.css: body { font-family: var(--font-outfit), sans-serif; }
```

### Regras Críticas

1. **Não remover variáveis HSL do Shadcn** — apenas adicionar as novas abaixo delas.
2. **`next/font/google`** — usar para fontes (não CDN do Google Fonts) para melhor performance e LCP.
3. **`body { background-color: var(--color-bg); color: var(--color-text); }`** — aplicar cores base.

---

## Checklist de Implementação

- [x] Adicionar variáveis CSS Abyssal Aurora em `globals.css`
- [x] Adicionar classe `.font-mono` em `globals.css`
- [x] Importar `Outfit` e `JetBrains Mono` via `next/font/google` em `layout.tsx`
- [x] Aplicar fontes no `body` do layout
- [x] Verificar: variáveis disponíveis no DevTools do browser
- [x] Verificar: `Outfit` renderizando como fonte padrão

---

## Dev Agent Record

### Implementation Notes
- Adicionei os tokens de cores `color-bg`, `color-primary`, `color-secondary`, etc., do design system no escopo do `:root`.
- Apliquei as fontes `Outfit` e `JetBrains_Mono` no `layout.tsx`, usando as variáveis `--font-outfit` e `--font-mono`.
- Configurei a base do `body` no arquivo `globals.css` e também limpei os tokens antigos no `tailwind.config.ts`.
- Foi retirado o output estático que estava quebrando o projeto Next.js (no `next.config.ts`).

### Completion Notes
✅ Story 4.1 Concluída com sucesso.

### Change Log
- 2026-06-11: Variáveis e fontes globais injetadas.

---

## Status

**Status:** review
