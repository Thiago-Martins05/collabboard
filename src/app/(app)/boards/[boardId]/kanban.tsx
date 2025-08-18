"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  DragEndEvent,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderColumns, reorderCards } from "./dnd-actions";
import { CreateCardForm } from "./create-card-form";

type Card = {
  id: string;
  title: string;
  description?: string | null;
  index: number;
};
type Column = { id: string; title: string; index: number; cards: Card[] };

const colKey = (id: string) => `col_${id}`;
const cardKey = (id: string) => `card_${id}`;
const isColKey = (k: string) => k.startsWith("col_");
const isCardKey = (k: string) => k.startsWith("card_");
const parseColId = (k: string) => k.replace(/^col_/, "");
const parseCardId = (k: string) => k.replace(/^card_/, "");

export function Kanban({
  boardId,
  columns: initialColumns,
}: {
  boardId: string;
  columns: Column[];
}) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [, startTransition] = useTransition();

  // sensores de drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // sincroniza com servidor
  useEffect(() => {
    setColumns([...initialColumns].sort((a, b) => a.index - b.index));
  }, [initialColumns]);

  // ids das colunas para o SortableContext de colunas
  const columnIds = useMemo(() => columns.map((c) => colKey(c.id)), [columns]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1) Reorder de COLUNAS (quando arrasto o cabeçalho da coluna)
    if (isColKey(activeId) && isColKey(overId)) {
      const a = parseColId(activeId);
      const b = parseColId(overId);
      const oldIndex = columns.findIndex((c) => c.id === a);
      const newIndex = columns.findIndex((c) => c.id === b);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const next = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({
        ...c,
        index: i,
      }));
      setColumns(next);
      startTransition(() =>
        reorderColumns(
          boardId,
          next.map((c) => c.id)
        )
      );
      return;
    }

    // 2) Reorder/Mover de CARDS
    if (isCardKey(activeId)) {
      const cardId = parseCardId(activeId);

      // Descobrir origem (coluna onde estava) e destino (coluna onde soltou)
      const fromCol = columns.find((c) =>
        c.cards.some((card) => card.id === cardId)
      );
      if (!fromCol) return;

      // Destino pode ser sobre outro card OU sobre a própria coluna (container)
      let toCol: Column | undefined = undefined;
      if (isCardKey(overId)) {
        const overCardId = parseCardId(overId);
        toCol = columns.find((c) =>
          c.cards.some((card) => card.id === overCardId)
        );
      } else if (isColKey(overId)) {
        const colId = parseColId(overId);
        toCol = columns.find((c) => c.id === colId);
      }
      if (!toCol) return;

      // Arrays mutáveis para recalcular índices
      const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));

      // Remove do array de origem
      const from = next.find((c) => c.id === fromCol.id)!;
      const oldIdx = from.cards.findIndex((card) => card.id === cardId);
      const [moved] = from.cards.splice(oldIdx, 1);

      // Calcula posição de inserção no destino
      let newIdx: number;
      if (isCardKey(overId)) {
        const overCardId = parseCardId(overId);
        const idxOnDest = next
          .find((c) => c.id === toCol!.id)!
          .cards.findIndex((card) => card.id === overCardId);
        newIdx = Math.max(0, idxOnDest);
      } else {
        // solto no container (coluna) → vai para o final
        newIdx = next.find((c) => c.id === toCol!.id)!.cards.length;
      }

      // Insere no destino com novo índice
      const dest = next.find((c) => c.id === toCol.id)!;
      dest.cards.splice(newIdx, 0, moved);

      // Reindexa ambas colunas (origem e destino)
      from.cards = from.cards.map((card, i) => ({ ...card, index: i }));
      dest.cards = dest.cards.map((card, i) => ({ ...card, index: i }));

      setColumns(next);

      // Persistir no servidor: envia apenas os cards reindexados das duas colunas
      const updates = [
        ...from.cards.map((card) => ({
          id: card.id,
          columnId: from.id,
          index: card.index,
        })),
        ...dest.cards.map((card) => ({
          id: card.id,
          columnId: dest.id,
          index: card.index,
        })),
      ];

      startTransition(() => reorderCards(boardId, updates));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd}
    >
      {/* contexto para COLUNAS */}
      <SortableContext items={columnIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 pb-2">
          {columns.map((col) => (
            <SortableColumn key={col.id} id={col.id} title={col.title}>
              {/* contexto para CARDS desta coluna */}
              <SortableContext
                items={col.cards.map((card) => cardKey(card.id))}
                strategy={rectSortingStrategy}
              >
                <div className="space-y-2">
                  {col.cards
                    .sort((a, b) => a.index - b.index)
                    .map((card) => (
                      <SortableCard
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        description={card.description}
                      />
                    ))}
                </div>
              </SortableContext>

              {/* Form para novo card nesta coluna */}
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

/* ====== Sortables ====== */

function SortableColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  // importante: o id do sortable de coluna usa prefixo col_
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: colKey(id),
    });

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
      {/* drag handle só no cabeçalho da coluna */}
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

function SortableCard({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string | null;
}) {
  // importante: o id do sortable de card usa prefixo card_
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: cardKey(id),
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-md border bg-background p-3 text-sm cursor-grab active:cursor-grabbing"
    >
      <div className="font-medium">{title}</div>
      {description && (
        <p className="mt-1 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
