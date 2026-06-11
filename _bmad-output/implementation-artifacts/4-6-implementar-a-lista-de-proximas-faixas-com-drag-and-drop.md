# Story 4.6: Implementar a Lista de Próximas Faixas com Drag-and-Drop

## Metadados

| Campo             | Valor                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **Story ID**      | 4.6                                                                            |
| **Story Key**     | 4-6-implementar-a-lista-de-proximas-faixas-com-drag-and-drop                   |
| **Epic**          | Epic 4 — Interface Visual — Dashboard e MiniPlayer Cinematic                   |
| **Status**        | ready-for-dev                                                                  |
| **Esforço Est.**  | ~4h                                                                            |
| **Depende de**    | Story 4.5 (NowPlayingCard), Story 4.13 (WebSocket)                            |

---

## User Story

> **Como** Bruno,
> **Eu quero** que as próximas faixas da fila sejam listadas em cards reordenáveis via drag-and-drop,
> **Para que** eu reorganize a ordem de reprodução diretamente no Dashboard.

---

## Acceptance Criteria (BDD)

### AC1 — Elevação ao arrastar
```gherkin
When Bruno clica e segura um card de faixa
Then o card eleva-se com `transform: scale(1.02)` e `box-shadow` ampliado em `ease-out` de 200ms
```

### AC2 — Reordenação e evento WebSocket
```gherkin
When Bruno solta o card em nova posição
Then assenta com `ease-out` de 200ms
And Dashboard envia `{ "event": "queue:reorder", "payload": { "newOrder": [...ids] } }` via WebSocket
And reordenação é refletida imediatamente na UI (otimista, sem aguardar servidor)
```

### AC3 — Toast de confirmação
```gherkin
Then Toast translúcido com `slide-up` + `fade-in` de 300ms aparece no canto inferior direito: `✓ Queue updated`
And desaparece automaticamente após 3s com `fade-out`
```

---

## Contexto para o Agente de Desenvolvimento

### Biblioteca de DnD

Usar **`@dnd-kit/core`** e **`@dnd-kit/sortable`** — compatíveis com React 19 e sem dependência de DOM legado:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Implementação Básica

```tsx
'use client';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function QueueList({ queue, currentTrackId, onReorder }: {
  queue: TrackInfo[];
  currentTrackId: string | null;
  onReorder: (newOrder: string[]) => void;
}) {
  const upcomingTracks = queue.filter((t) => t.id !== currentTrackId);
  const [items, setItems] = useState(upcomingTracks);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder(reordered.map((t) => t.id));
    showToast('✓ Queue updated');
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {items.map((track) => <SortableTrackCard key={track.id} track={track} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Toast

Criar `src/components/ui/Toast.tsx` simples com CSS animation `slide-up` + `fade-out` via `setTimeout`.

### Regras Críticas

1. **Reordenação otimista** — atualizar `items` localmente antes de receber resposta do servidor.
2. **Evento `queue:reorder`** — o servidor deve atualizar `state.queue` ao receber este evento (adicionar handler em `server/server.ts`).
3. **`@dnd-kit`** (não `react-dnd` nem `react-beautiful-dnd`) — libs mais modernas e compatíveis com React 19.

---

## Checklist de Implementação

- [x] Instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [x] Criar `QueueList.tsx` com DnD funcional
- [x] Criar Toast component com animação slide-up (usado `useToast` do Shadcn já incluso no boilerplate)
- [x] Adicionar handler `queue:reorder` em `server/server.ts`
- [x] Verificar: drag → elevação visual → soltar → reordenação + toast
- [x] Verificar: evento WebSocket `queue:reorder` enviado com novo array de ids

---

## Dev Agent Record

### Implementation Notes
- Utilizado `@dnd-kit` moderno com as estratégias e hooks `useSortable`. O DnD permite reordenamento stateful na UI antes de enviar o command.
- O handler WebSocket no backend `queue:reorder` extrai os `TrackInfo` do `newOrder` IDs e adiciona o current track de volta no ínicio caso filtrado.
- Feedback visual de reordenamento otimista na frontend integrado usando shadcn-ui toast.

### Completion Notes
✅ Story 4.6 finalizada e lista arrastável mockada na layout base pronta para socket data.

### Change Log
- 2026-06-11: DnD para Playlist Tracks integrado na UI.

---

## Status

**Status:** review
