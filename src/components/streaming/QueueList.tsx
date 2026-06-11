'use client';
import { useState, useEffect } from 'react';
import { TrackInfo } from '@/types/shared';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SortableTrackCard({ track }: { track: TrackInfo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 mb-2 rounded-xl bg-surface/80 border ${isDragging ? 'border-primary shadow-[0_0_15px_rgba(0,240,255,0.2)] scale-[1.02]' : 'border-border/50 hover:bg-surface'} transition-all`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary active:cursor-grabbing text-muted p-1">
        <GripVertical size={16} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="text-sm font-bold text-white truncate font-outfit">
          {track.filename.replace(/\.mp3$/i, '')}
        </div>
        <div className="text-xs text-muted truncate">
          Unknown Artist
        </div>
      </div>
    </div>
  );
}

export function QueueList({ queue, currentTrackId, onReorder }: {
  queue: TrackInfo[];
  currentTrackId: string | null;
  onReorder: (newOrder: string[]) => void;
}) {
  const { toast } = useToast();
  
  // Update items when queue prop changes, but preserve local order if dragging
  const upcomingTracks = queue.filter((t) => t.id !== currentTrackId);
  const [items, setItems] = useState(upcomingTracks);

  useEffect(() => {
    setItems(queue.filter((t) => t.id !== currentTrackId));
  }, [queue, currentTrackId]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder(reordered.map((t) => t.id));
    
    toast({
      description: "✓ Queue updated",
      duration: 3000,
    });
  };

  return (
    <div className="glass-card flex flex-col h-full max-h-[500px]">
      <h3 className="text-xl font-bold font-outfit text-white mb-4">Up Next</h3>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No upcoming tracks</div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {items.map((track) => (
                <SortableTrackCard key={track.id} track={track} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
