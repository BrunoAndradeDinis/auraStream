# Story 4.5: Implementar a Seção de Fila — Faixa Atual em Destaque

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 4.5                                                                    |
| **Story Key**     | 4-5-implementar-a-secao-de-fila-faixa-atual-em-destaque                |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic           |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 4.2 (layout), Story 4.13 (WebSocket hook)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** que a faixa em reprodução seja exibida com destaque máximo na área central,
> **Para que** eu identifique de relance qual música está sendo transmitida agora.

---

## Acceptance Criteria (BDD)

### AC1 — Faixa atual exibida com destaque
```gherkin
Given `state.currentTrack` não é null
When a seção "Now Playing" renderiza
Then título em Outfit bold 20px #FFFFFF, artista 14px #94A3B8
And barra de progresso animada em Cyan como waveform placeholder
And borda `2px solid var(--color-primary)` com `box-shadow: 0 0 12px rgba(0, 240, 255, 0.3)`
```

### AC2 — Fila vazia exibe mensagem
```gherkin
When `state.currentTrack === null`
Then exibe `No tracks in queue — add .mp3 files to ./src/assets/audio/` em #94A3B8
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Criar `src/components/streaming/NowPlayingCard.tsx`:

```tsx
'use client';
import { TrackInfo } from '@/types/shared';

export function NowPlayingCard({ currentTrack }: { currentTrack: TrackInfo | null }) {
  if (!currentTrack) {
    return (
      <div className="glass-card" style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
        No tracks in queue — add .mp3 files to ./src/assets/audio/
      </div>
    );
  }

  return (
    <div className="glass-card" style={{
      border: '2px solid var(--color-primary)',
      boxShadow: '0 0 12px rgba(0, 240, 255, 0.3)',
    }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '20px', color: '#FFFFFF' }}>
        {currentTrack.filename.replace(/\.mp3$/i, '')}
      </div>
      <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>
        {/* Artista virá dos metadados (Story 3.3) — placeholder por enquanto */}
        Unknown Artist
      </div>
      <WaveformPlaceholder />
    </div>
  );
}

function WaveformPlaceholder() {
  // Barras animadas simulando waveform
  return (
    <div style={{ display: 'flex', gap: '3px', marginTop: '12px', alignItems: 'flex-end', height: '24px' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: '3px',
          background: 'var(--color-primary)',
          animation: `waveform 1.2s ease-in-out ${i * 0.06}s infinite alternate`,
          height: `${Math.random() * 16 + 4}px`,
        }} />
      ))}
    </div>
  );
}
```

Adicionar keyframe no `globals.css`:
```css
@keyframes waveform {
  from { transform: scaleY(0.3); }
  to { transform: scaleY(1); }
}
```

---

## Checklist de Implementação

- [ ] Criar `NowPlayingCard.tsx`
- [ ] Adicionar `@keyframes waveform` no `globals.css`
- [ ] Integrar na área central do Dashboard
- [ ] Verificar: faixa atual exibida com borda Cyan e glow
- [ ] Verificar: mensagem de fila vazia quando `currentTrack === null`

---

## Status

**Status:** ready-for-dev
