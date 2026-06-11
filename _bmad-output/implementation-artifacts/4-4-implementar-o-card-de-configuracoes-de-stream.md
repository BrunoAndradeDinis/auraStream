# Story 4.4: Implementar o Card de Configurações de Stream

## Metadados

| Campo             | Valor                                                                  |
|-------------------|------------------------------------------------------------------------|
| **Story ID**      | 4.4                                                                    |
| **Story Key**     | 4-4-implementar-o-card-de-configuracoes-de-stream                      |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic           |
| **Status**        | ready-for-dev                                                          |
| **Esforço Est.**  | ~3h                                                                    |
| **Depende de**    | Story 4.2 (layout), Story 4.13 (WebSocket hook)                       |

---

## User Story

> **Como** Bruno,
> **Eu quero** um card com controles de Stream Key mascarado, bitrate e resolução na área central,
> **Para que** eu configure a transmissão diretamente pelo Dashboard sem usar a CLI.

---

## Acceptance Criteria (BDD)

### AC1 — Stream Key mascarada
```gherkin
Given o card "Stream Config" está visível
When Bruno clica no campo de Stream Key
Then input `type="password"` exibe apenas `●●●●●●●●`
And ao confirmar, envia `{ "event": "config:stream_key", "payload": "..." }` via WebSocket
And nenhum valor de Stream Key é logado no console do browser
```

### AC2 — Slider de bitrate
```gherkin
Then slider de 1500 a 8000 kbps com valor padrão 3500 exibe valor atual em JetBrains Mono
```

### AC3 — Dropdown de resolução
```gherkin
Then dropdown com opções `1080p`, `720p`, `480p` está disponível
```

---

## Contexto para o Agente de Desenvolvimento

### Componente

Criar `src/components/streaming/StreamConfigCard.tsx`:

```tsx
'use client';
import { useState } from 'react';

export function StreamConfigCard({ onSend }: { onSend: (event: string, payload: unknown) => void }) {
  const [bitrate, setBitrate] = useState(3500);
  const [resolution, setResolution] = useState('1080p');

  const handleKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const key = (e.currentTarget.elements.namedItem('streamKey') as HTMLInputElement).value;
    if (key) {
      onSend('config:stream_key', key);
      // NUNCA console.log(key)
    }
  };

  return (
    <div className="glass-card">
      <h3>Stream Config</h3>
      <form onSubmit={handleKeySubmit}>
        <input type="password" name="streamKey" placeholder="YouTube Stream Key" autoComplete="off" />
        <button type="submit">Set Key</button>
      </form>
      <div>
        <label>Bitrate: <span style={{ fontFamily: 'JetBrains Mono' }}>{bitrate}k</span></label>
        <input type="range" min={1500} max={8000} step={100} value={bitrate} onChange={(e) => setBitrate(+e.target.value)} />
      </div>
      <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
        <option>1080p</option>
        <option>720p</option>
        <option>480p</option>
      </select>
    </div>
  );
}
```

Adicionar classe `.glass-card` no `globals.css` (Story 4.12 fará o glassmorphism completo):
```css
.glass-card {
  background: rgba(2, 6, 23, 0.70);
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
}
```

### Regras Críticas

1. **`console.log` da Stream Key é PROIBIDO** — nem parcialmente, nem com asteriscos parciais.
2. **`type="password"`** — obrigatório para o campo de Stream Key.
3. **Bitrate e resolução** — atualmente são apenas configurações visuais; a Story 2.6 os lerá do estado para passar ao FFmpeg (integração futura).

---

## Checklist de Implementação

- [x] Criar `StreamConfigCard.tsx`
- [x] Adicionar classe `.glass-card` no `globals.css`
- [x] Integrar card na área central do Dashboard
- [x] Verificar: campo Stream Key type="password"
- [x] Verificar: chave enviada via WebSocket sem log
- [x] Verificar: slider de bitrate funcional

---

## Dev Agent Record

### Implementation Notes
- Criado o card de StreamConfig com input de type password pra prevenir vazamentos do StreamKey durante lives (caso a tela do OBS do host vaze).
- Estilo `glass-card` incluído no `globals.css` para a UI.
- O componente já foi acoplado no mock WebSocket do dashboard.

### Completion Notes
✅ Story 4.4 implementada.

### Change Log
- 2026-06-11: Adicionado controle de Bitrate, Resolution e StreamKey seguro.

---

## Status

**Status:** review
