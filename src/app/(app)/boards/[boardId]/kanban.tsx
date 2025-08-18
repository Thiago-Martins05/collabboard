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
import { CreateCardForm } from "./create-card-form";
import { reorderColumns, reorderCards } from "./dnd-actions";
import { deleteCard, deleteColumn } from "./manage-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Card = {
  id: string;
  title: string;
  description?: string | null;
  index: number;
};
type Column = { id: string; title: string; index: number; cards: Card[] };

/* helpers para IDs de DnD */
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // sincroniza com dados do servidor sempre que mudar
  useEffect(() => {
    setColumns([...initialColumns].sort((a, b) => a.index - b.index));
  }, [initialColumns]);

  const columnIds = useMemo(() => columns.map((c) => colKey(c.id)), [columns]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1) Reordena colunas
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

    // 2) Reordena / move cards
    if (isCardKey(activeId)) {
      const cardId = parseCardId(activeId);

      // coluna de origem
      const fromCol = columns.find((c) =>
        c.cards.some((card) => card.id === cardId)
      );
      if (!fromCol) return;

      // destino pode ser sobre outro card OU sobre a coluna (container)
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

      // cópia segura (imutabilidade)
      const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));

      // remove do array de origem
      const from = next.find((c) => c.id === fromCol.id)!;
      const oldIdx = from.cards.findIndex((card) => card.id === cardId);
      const [moved] = from.cards.splice(oldIdx, 1);

      // índice no destino
      let newIdx: number;
      if (isCardKey(overId)) {
        const overCardId = parseCardId(overId);
        const idxOnDest = next
          .find((c) => c.id === toCol!.id)!
          .cards.findIndex((card) => card.id === overCardId);
        newIdx = Math.max(0, idxOnDest);
      } else {
        newIdx = next.find((c) => c.id === toCol!.id)!.cards.length;
      }

      // insere no destino
      const dest = next.find((c) => c.id === toCol.id)!;
      dest.cards.splice(newIdx, 0, moved);

      // reindexa origem e destino
      from.cards = from.cards.map((card, i) => ({ ...card, index: i }));
      dest.cards = dest.cards.map((card, i) => ({ ...card, index: i }));

      setColumns(next);

      // persiste apenas alterações das duas colunas
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
      {/* contexto de COLUNAS */}
      <SortableContext items={columnIds} strategy={rectSortingStrategy}>
        {/* quebra de linha, sem scroll horizontal */}
        <div className="flex flex-wrap gap-4 pb-2">
          {columns.map((col) => (
            <SortableColumn
              key={col.id}
              id={col.id}
              title={col.title}
              boardId={boardId}
            >
              {/* contexto de CARDS da coluna */}
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
                        boardId={boardId}
                      />
                    ))}
                </div>
              </SortableContext>

              {/* novo card nesta coluna */}
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

/* ================= Sortables ================= */

function SortableColumn({
  id,
  title,
  children,
  boardId,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  boardId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: colKey(id),
    });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  const router = useRouter();
  const [, startTransition] = useTransition();

  async function onConfirmDelete() {
    startTransition(async () => {
      await deleteColumn(boardId, id);
      router.refresh();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between select-none">
        {/* drag handle só no título */}
        <h2
          className="text-sm font-medium text-muted-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          {title}
        </h2>

        {/* deletar coluna */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="rounded p-1 hover:bg-accent hover:text-accent-foreground"
              onClick={(e) => e.stopPropagation()}
              aria-label="Excluir coluna"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta coluna?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {children}
    </div>
  );
}

function SortableCard({
  id,
  title,
  description,
  boardId,
}: {
  id: string;
  title: string;
  description?: string | null;
  boardId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: cardKey(id),
    });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  const router = useRouter();
  const [, startTransition] = useTransition();

  async function onConfirmDelete() {
    startTransition(async () => {
      await deleteCard(boardId, id);
      router.refresh();
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-md border bg-background p-3 text-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium">{title}</div>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>

        {/* deletar card */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="shrink-0 rounded p-1 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // não iniciar drag
              }}
              aria-label="Excluir card"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este card?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirmDelete}
                className="cursor-pointer"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
