# Story 4.10: Criar o Componente MiniPlayer — Estrutura e Dados

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 4.10                                                                   |
| **Story Key**     | 4-10-criar-o-componente-miniplayer-estrutura-e-dados                   |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic           |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 2.2 (página compositora), Story 4.1 (design system)             |

---

## User Story

> **Como** Bruno,
> **Eu quero** que `src/components/streaming/MiniPlayer.tsx` exiba título, artista, gênero e descrição da faixa em overlay fixo no canto inferior direito,
> **Para que** os espectadores do YouTube vejam as informações da música durante a transmissão.

---

## Acceptance Criteria (BDD)

### AC1 — Layout e posicionamento
```gherkin
Given a página compositora está carregada e `state.currentTrack` não é null
When o MiniPlayer renderiza
Then posicionado `fixed bottom-5 right-5` com dimensões `280px × 140px`
And exibe: título Outfit 14px bold #FFFFFF, artista Inter 12px #94A3B8, gênero 10px #7C3AED, descrição 9px italic #94A3B8 truncada em 2 linhas
And fundo `rgba(2, 6, 23, 0.85)` com `backdrop-blur: 8px` e borda superior `2px solid #7C3AED`
```

### AC2 — Passivo (não responde a interações)
```gherkin
Then o componente não responde a cliques nem hover (pointer-events: none)
```

### AC3 — Null quando sem faixa
```gherkin
When `state.currentTrack === null`
Then MiniPlayer retorna `null` e não é renderizado
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Arquivo: `src/components/streaming/MiniPlayer.tsx` (pode já existir — verificar antes de criar).

```tsx
'use client';
import { TrackInfo } from '@/types/shared';

interface MiniPlayerProps {
  currentTrack: TrackInfo | null;
}

export function MiniPlayer({ currentTrack }: MiniPlayerProps) {
  if (!currentTrack) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '280px',
      height: '140px',
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      borderTop: '2px solid #7C3AED',
      borderRadius: '8px',
      padding: '12px 16px',
      pointerEvents: 'none', // passivo
      zIndex: 100,
      overflow: 'hidden',
    }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '14px', color: '#FFFFFF', 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {currentTrack.filename.replace(/\.mp3$/i, '')}
      </div>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
        {currentTrack.metadata?.artist ?? 'Unknown Artist'}
      </div>
      <div style={{ fontSize: '10px', color: '#7C3AED', marginTop: '2px' }}>
        {currentTrack.metadata?.genre ?? ''}
      </div>
      {currentTrack.aiDescription && (
        <div style={{
          fontSize: '9px', fontStyle: 'italic', color: '#94A3B8', marginTop: '6px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {currentTrack.aiDescription}
        </div>
      )}
    </div>
  );
}
```

### Campos Adicionais em `TrackInfo`

Adicionar em `server/types.ts`:
```typescript
export interface TrackInfo {
  // ... campos existentes
  metadata?: {
    artist: string;
    genre: string;
    source: string;
  };
  aiDescription?: string | null;
}
```

---

## Checklist de Implementação

- [ ] Verificar se `MiniPlayer.tsx` existente pode ser adaptado
- [ ] Implementar/atualizar com estrutura e estilos corretos
- [ ] Adicionar campos `metadata` e `aiDescription` em `TrackInfo`
- [ ] Integrar na página compositora (`src/app/page.tsx`)
- [ ] Verificar: overlay fixo canto inferior direito
- [ ] Verificar: `pointer-events: none` (não interage com cliques)
- [ ] Verificar: `null` quando sem faixa atual

---

## Status

**Status:** ready-for-dev
