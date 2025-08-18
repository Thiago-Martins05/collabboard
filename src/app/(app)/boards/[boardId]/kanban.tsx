"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderColumns } from "./dnd-actions";
import { CreateCardForm } from "./create-card-form"; // ⬅️ add

type Card = {
  id: string;
  title: string;
  description?: string | null;
  index: number;
};
type Column = { id: string; title: string; index: number; cards: Card[] };

export function Kanban({
  boardId,
  columns: initialColumns,
}: {
  boardId: string;
  columns: Column[];
}) {
  const [columns, setColumns] = useState(
    [...initialColumns].sort((a, b) => a.index - b.index)
  );
  const items = columns.map((c) => c.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [, startTransition] = useTransition();

  function onDragEnd(e: any) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    const next = arrayMove(columns, oldIndex, newIndex);
    setColumns(next);
    startTransition(() =>
      reorderColumns(
        boardId,
        next.map((c) => c.id)
      )
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 pb-2">
          {columns.map((col) => (
            <SortableColumn key={col.id} id={col.id} title={col.title}>
              <div className="space-y-2">
                {col.cards
                  .sort((a, b) => a.index - b.index)
                  .map((card) => (
                    <div
                      key={card.id}
                      className="rounded-md border bg-background p-3 text-sm"
                    >
                      <div className="font-medium">{card.title}</div>
                      {card.description && (
                        <p className="mt-1 text-muted-foreground">
                          {card.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>

              {/* Form de novo card dentro da coluna */}
              <div className="mt-4">
                <CreateCardForm boardId={boardId} columnId={col.id} />
              </div>
            </SortableColumn>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 rounded-lg border bg-card p-4 shadow-sm"
    >
      {/* drag handle só no header */}
      <div
        className="mb-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        {...attributes}
        {...listeners}
      >
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
