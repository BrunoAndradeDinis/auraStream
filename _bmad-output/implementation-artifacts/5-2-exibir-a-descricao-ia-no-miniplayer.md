# Story 5.2: Exibir a Descrição IA no MiniPlayer

## Metadados

| Campo             | Valor                                                              |
|-------------------|--------------------------------------------------------------------|
| **Story ID**      | 5.2                                                                |
| **Story Key**     | 5-2-exibir-a-descricao-ia-no-miniplayer                            |
| **Epic**          | Epic 5 — Automação e Descrições via IA *(Opcional)*                |
| **Status**        | ready-for-dev                                                      |
| **Esforço Est.**  | ~2h                                                                |
| **Depende de**    | Story 5.1 (geração de descrição), Story 4.10 (MiniPlayer)         |

---

## User Story

> **Como** Bruno,
> **Eu quero** que o MiniPlayer exiba a `aiDescription` gerada abaixo do gênero da faixa.

---

## Acceptance Criteria (BDD)

### AC1 — Descrição exibida quando disponível
```gherkin
Given `state.currentTrack.aiDescription` não é null
When o MiniPlayer renderiza
Then a descrição é exibida em `Inter` 9px italic `#94A3B8`
And limitada a 2 linhas com `overflow: hidden; text-overflow: ellipsis; -webkit-line-clamp: 2`
```

### AC2 — Omitida quando null
```gherkin
Given `state.currentTrack.aiDescription === null`
When o MiniPlayer renderiza
Then a linha de descrição é omitida e o layout se ajusta verticalmente sem espaço vazio
```

---

## Contexto para o Agente de Desenvolvimento

### Modificação em `MiniPlayer.tsx`

O campo `aiDescription` já foi adicionado em `TrackInfo` na Story 4.10. Esta story apenas garante que ele é renderizado condicionalmente:

```tsx
{currentTrack.aiDescription && (
  <div style={{
    fontSize: '9px',
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: '6px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  }}>
    {currentTrack.aiDescription}
  </div>
)}
```

> **Nota:** Se `aiDescription` é `undefined` (ainda não gerada) ou `null` (falhou), o bloco não renderiza. Isso é o comportamento correto.

### Fonte `Inter`

Verificar se `Inter` já está importada no projeto (o Shadcn/UI usa Inter por padrão). Se não, adicionar via `next/font/google` no `layout.tsx`.

---

## Checklist de Implementação

- [x] Verificar campo `aiDescription` em `TrackInfo` (Story 4.10/5.1)
- [x] Adicionar renderização condicional em `MiniPlayer.tsx`
- [x] Verificar: descrição exibida em 9px italic #94A3B8 limitada a 2 linhas
- [x] Verificar: layout sem espaço vazio quando `aiDescription === null`

---

## Dev Agent Record

### Implementation Notes
- O código do MiniPlayer já tinha sido condicionalmente adaptado na Story 4.10.
- `aiDescription` é um node opcional no DOM que só consome layout vertical quando o texto existe de facto, garantindo que o spacing obedece às flex rules quando o campo não é recebido do back-end.

### Completion Notes
✅ Story 5.2 validada como já implementada.

### Change Log
- 2026-06-11: Confirmação de render condicional com WebkitLineClamp ativo em 2 linhas.

---

## Status

**Status:** review
