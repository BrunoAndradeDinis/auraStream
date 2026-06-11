# Story 4.2: Criar o Layout Base do Dashboard (Sidebar + Área Central)

## Metadados

| Campo             | Valor                                                                      |
|-------------------|----------------------------------------------------------------------------|
| **Story ID**      | 4.2                                                                        |
| **Story Key**     | 4-2-criar-o-layout-base-do-dashboard-sidebar-area-central                  |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic               |
| **Status**        | ready-for-dev                                                              |
| **Esforço Est.**  | ~3h                                                                        |
| **Depende de**    | Story 4.1 (design system configurado)                                      |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o Dashboard tenha uma sidebar fixa à esquerda e uma área central scrollável com padding confortável,
> **Para que** a interface de operação esteja estruturalmente organizada antes de qualquer funcionalidade ser adicionada.

---

## Acceptance Criteria (BDD)

### AC1 — Layout base renderiza
```gherkin
Given Bruno acessa `http://localhost:9002/dashboard`
When a página renderiza
Then sidebar fixa de 240px é exibida à esquerda com fundo `rgba(2, 6, 23, 0.95)` e borda direita `1px solid rgba(0, 240, 255, 0.15)`
And área central ocupa o restante com `padding: 24px`, fundo `var(--color-bg)` e scroll vertical independente
```

### AC2 — Responsivo em telas < 768px
```gherkin
Given tela menor que 768px
When a página renderiza
Then a sidebar se colapsa para ícone de hambúrguer
```

### AC3 — Tipografia correta
```gherkin
Then fonte base é `Outfit`
And dados técnicos (uptime, timestamps) usam `JetBrains Mono`
```

---

## Contexto para o Agente de Desenvolvimento

### Arquivo a Criar

`src/app/dashboard/page.tsx` — nova rota do Dashboard.

> **Nota:** Next.js com `output: 'export'` suporta rotas estáticas. `src/app/dashboard/page.tsx` gera `/dashboard` como página estática.

### Estrutura do Layout

```tsx
// src/components/streaming/Dashboard.tsx
'use client';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      background: 'rgba(2, 6, 23, 0.95)',
      borderRight: '1px solid rgba(0, 240, 255, 0.15)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--color-primary)', fontSize: '18px' }}>
        AuraStream
      </div>
      {/* Cards da sidebar adicionados nas Stories 4.3, 4.8 */}
    </aside>
  );
}
```

### Regras Críticas

1. **`position: relative; z-index: 1`** na área central — necessário para que o canvas da Aurora (Story 4.9, z-index: 0) fique atrás.
2. **Sidebar `flexShrink: 0`** — impedir que a sidebar encolha com o conteúdo.
3. **Hambúrguer em mobile** — usar `@media (max-width: 768px)` para colapsar a sidebar.
4. **`src/app/dashboard/page.tsx`** deve importar e usar `DashboardLayout` de `src/components/streaming/Dashboard.tsx`.

---

## Checklist de Implementação

- [ ] Criar `src/app/dashboard/page.tsx`
- [ ] Criar `src/components/streaming/Dashboard.tsx` com `DashboardLayout` e `Sidebar`
- [ ] Verificar: `/dashboard` renderiza corretamente em localhost:9002
- [ ] Verificar: sidebar fixa de 240px com fundo e borda corretos
- [ ] Verificar: área central com scroll independente
- [ ] Verificar: colapso de sidebar em viewport < 768px

---

## Status

**Status:** ready-for-dev
