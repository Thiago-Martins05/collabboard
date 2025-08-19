// src/app/(app)/boards/[boardId]/kanban.tsx
"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { CreateCardForm } from "./create-card-form";
import { RenameColumnDialog } from "./rename-column-dialog";
import { DeleteColumnDialog } from "./delete-column-dialog";
import { RenameCardDialog } from "./rename-card-dialog";
import { DeleteCardDialog } from "./delete-card-dialog";
import { reorderCards } from "./reorder-actions";
import { reorderColumns } from "./reorder-columns";

type CardDTO = {
  id: string;
  title: string;
  description?: string | null;
  index: number;
};

type ColumnDTO = {
  id: string;
  title: string;
  index: number;
  cards: CardDTO[];
};

export function Kanban({
  boardId,
  columns: initialColumns,
}: {
  boardId: string;
  columns: ColumnDTO[];
}) {
  const router = useRouter();
  const [isPersisting, startPersist] = React.useTransition();

  const [columns, setColumns] = React.useState<ColumnDTO[]>(
    normalize(initialColumns)
  );

  React.useEffect(
    () => setColumns(normalize(initialColumns)),
    [initialColumns]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // IDs das colunas (ordem visual)
  const columnIds = React.useMemo(() => columns.map((c) => c.id), [columns]);

  const onDragEnd = React.useCallback(
    (evt: DragEndEvent) => {
      const { active, over } = evt;
      if (!over) return;

      const activeType = active.data?.current?.type as
        | "column"
        | "card"
        | undefined;
      const overType = over.data?.current?.type as
        | "column"
        | "card"
        | undefined;

      // =============== COLUNAS ===============
      if (activeType === "column" && overType === "column") {
        const activeId = String(active.id);
        const overId = String(over.id);

        const fromIdx = columns.findIndex((c) => c.id === activeId);
        const toIdx = columns.findIndex((c) => c.id === overId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

        const next = arrayMove(columns, fromIdx, toIdx).map((col, i) => ({
          ...col,
          index: i,
        }));
        setColumns(next);

        // persistir ordem final de colunas
        const fd = new FormData();
        fd.set("boardId", boardId);
        fd.set("columnIds", JSON.stringify(next.map((c) => c.id)));

        startPersist(async () => {
          const id = toast.loading("Salvando ordem das colunas…");
          const res = await reorderColumns({ ok: false }, fd);
          if (res.ok) {
            toast.success("Ordem das colunas salva!", { id });
            router.refresh();
          } else {
            toast.error(res.error ?? "Falha ao salvar ordem das colunas.", {
              id,
            });
            router.refresh();
          }
        });

        return;
      }

      // =============== CARDS ===============
      const activeId = String(active.id);
      const overId = String(over.id);

      // Caso 1: soltar em coluna vazia (over = "drop-{columnId}")
      if (overId.startsWith("drop-")) {
        const toColumnId = overId.replace("drop-", "");
        const fromColIdx = columns.findIndex((col) =>
          col.cards.some((c) => c.id === activeId)
        );
        const toColIdx = columns.findIndex((col) => col.id === toColumnId);
        if (fromColIdx === -1 || toColIdx === -1) return;

        const next = structuredClone(columns) as ColumnDTO[];
        const oldIndex = next[fromColIdx].cards.findIndex(
          (c) => c.id === activeId
        );
        if (oldIndex === -1) return;

        const [moved] = next[fromColIdx].cards.splice(oldIndex, 1);
        next[toColIdx].cards.push(moved);
        next[fromColIdx].cards = reindexCards(next[fromColIdx].cards);
        next[toColIdx].cards = reindexCards(next[toColIdx].cards);

        setColumns(next);
        persistCards(boardId, next, startPersist, router);
        return;
      }

      // Caso 2: card sobre card
      const fromColIdx = columns.findIndex((col) =>
        col.cards.some((c) => c.id === activeId)
      );
      const toColIdx = columns.findIndex((col) =>
        col.cards.some((c) => c.id === overId)
      );
      if (fromColIdx === -1 || toColIdx === -1) return;

      const oldIndex = columns[fromColIdx].cards.findIndex(
        (c) => c.id === activeId
      );
      const newIndex = columns[toColIdx].cards.findIndex(
        (c) => c.id === overId
      );
      if (oldIndex === -1 || newIndex === -1) return;

      const next = structuredClone(columns) as ColumnDTO[];

      if (fromColIdx === toColIdx) {
        next[fromColIdx].cards = reindexCards(
          arrayMove(next[fromColIdx].cards, oldIndex, newIndex)
        );
      } else {
        const [movedCard] = next[fromColIdx].cards.splice(oldIndex, 1);
        next[toColIdx].cards.splice(newIndex, 0, movedCard);
        next[fromColIdx].cards = reindexCards(next[fromColIdx].cards);
        next[toColIdx].cards = reindexCards(next[toColIdx].cards);
      }

      setColumns(next);
      persistCards(boardId, next, startPersist, router);
    },
    [boardId, columns, router]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      {/* SortableContext para COLUNAS */}
      <SortableContext items={columnIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 pb-2">
          {columns.map((col) => (
            <SortableColumn
              key={col.id}
              id={col.id}
              title={col.title}
              boardId={boardId}
            >
              {/* Zona droppable da coluna (aceita drops quando vazia) */}
              <ColumnDropZone columnId={col.id}>
                {/* SortableContext para CARDS desta coluna */}
                <SortableContext
                  items={col.cards.map((c) => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-2">
                    {col.cards.map((card) => (
                      <SortableCard key={card.id} id={card.id}>
                        <div className="rounded-md border bg-background p-3 text-sm group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {card.title}
                              </div>
                              {card.description && (
                                <p className="mt-1 text-muted-foreground line-clamp-3">
                                  {card.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {/* Editar card */}
                              <RenameCardDialog
                                boardId={boardId}
                                cardId={card.id}
                                currentTitle={card.title}
                                currentDescription={card.description}
                                trigger={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Editar card"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />

                              {/* Excluir card */}
                              <DeleteCardDialog
                                boardId={boardId}
                                cardId={card.id}
                                cardTitle={card.title}
                                trigger={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Excluir card"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </SortableCard>
                    ))}
                  </div>
                </SortableContext>

                {/* Form de novo card */}
                <div className="mt-4">
                  <CreateCardForm boardId={boardId} columnId={col.id} />
                </div>
              </ColumnDropZone>
            </SortableColumn>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* ---------- Zona droppable para colunas vazias ---------- */
function ColumnDropZone({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: `drop-${columnId}` });
  return <div ref={setNodeRef}>{children}</div>;
}

/* ---------- Sortable Column (com "data" para identificar tipo) ---------- */
function SortableColumn({
  id,
  title,
  boardId,
  children,
}: {
  id: string;
  title: string;
  boardId: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: { type: "column" as const, columnId: id },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-80 shrink-0 rounded-lg border bg-card p-3"
    >
      {/* Header da coluna com ações */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate font-semibold">{title}</h3>

        <div className="flex items-center gap-1">
          {/* Renomear coluna */}
          <RenameColumnDialog
            boardId={boardId}
            columnId={id}
            currentTitle={title}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                aria-label="Renomear coluna"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />

          {/* Excluir coluna */}
          <DeleteColumnDialog
            boardId={boardId}
            columnId={id}
            columnTitle={title}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                aria-label="Excluir coluna"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      {children}
    </div>
  );
}

/* ---------- Sortable Card (com "data" para identificar tipo) ---------- */
function SortableCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "card" as const, cardId: id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/* ---------- Helpers ---------- */
function normalize(cols: ColumnDTO[]): ColumnDTO[] {
  return cols
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((c) => ({
      ...c,
      index: c.index, // mantém índice vindo do server
      cards: c.cards.slice().sort((x, y) => x.index - y.index),
    }));
}

function reindexCards(cards: CardDTO[]): CardDTO[] {
  return cards.map((c, i) => ({ ...c, index: i }));
}

function buildCardUpdates(cols: ColumnDTO[]) {
  const updates: Array<{ id: string; columnId: string; index: number }> = [];
  for (const col of cols) {
    for (const card of col.cards) {
      updates.push({ id: card.id, columnId: col.id, index: card.index });
    }
  }
  return updates;
}

function persistCards(
  boardId: string,
  cols: ColumnDTO[],
  startPersist: React.TransitionStartFunction,
  router: ReturnType<typeof useRouter>
) {
  const updates = buildCardUpdates(cols);
  const fd = new FormData();
  fd.set("boardId", boardId);
  fd.set("updates", JSON.stringify(updates));

  startPersist(async () => {
    const id = toast.loading("Salvando ordem…");
    const res = await reorderCards({ ok: false }, fd);
    if (res.ok) {
      toast.success("Ordem salva!", { id });
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha ao salvar ordem.", { id });
      router.refresh();
    }
  });
}
