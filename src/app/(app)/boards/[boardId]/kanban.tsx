"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
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
import { CardModal } from "./card-modal";
import { reorderCards } from "./reorder-actions";
import { reorderColumns } from "./reorder-columns";
import { useRealtimeBoard } from "@/lib/realtime";
import { RealtimeStatus } from "@/components/realtime-status";

type CardDTO = {
  id: string;
  title: string;
  description?: string | null;
  index: number;
  cardLabels?: Array<{ labelId: string }>;
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
  labels,
}: {
  boardId: string;
  columns: ColumnDTO[];
  labels: Array<{ id: string; name: string; color: string }>;
}) {
  const router = useRouter();
  const [isPersisting, startPersist] = React.useTransition();

  const [columns, setColumns] = React.useState<ColumnDTO[]>(
    normalize(initialColumns)
  );

  const [activeDrag, setActiveDrag] = React.useState<
    | { type: "column"; id: string; title: string }
    | { type: "card"; id: string; title: string; description?: string | null }
    | null
  >(null);

  React.useEffect(
    () => setColumns(normalize(initialColumns)),
    [initialColumns]
  );

  // Hook de tempo real
  const { isConnected } = useRealtimeBoard(boardId, (event) => {
    console.log("Evento recebido:", event);

    switch (event.type) {
      case "column.created":
        setColumns((prev) => {
          const newColumns = [
            ...prev,
            {
              id: event.column.id,
              title: event.column.title,
              index: event.column.index,
              cards: [],
            },
          ];
          return normalize(newColumns);
        });
        break;

      case "column.updated":
        setColumns((prev) =>
          prev.map((col) =>
            col.id === event.column.id
              ? { ...col, title: event.column.title }
              : col
          )
        );
        break;

      case "column.deleted":
        setColumns((prev) => prev.filter((col) => col.id !== event.columnId));
        break;

      case "column.reordered":
        setColumns((prev) => {
          const newColumns = event.columnIds
            .map((id, index) => {
              const col = prev.find((c) => c.id === id);
              return col ? { ...col, index } : null;
            })
            .filter(Boolean) as ColumnDTO[];
          return normalize(newColumns);
        });
        break;

      case "card.created":
        setColumns((prev) =>
          prev.map((col) =>
            col.id === event.card.columnId
              ? {
                  ...col,
                  cards: [
                    ...col.cards,
                    {
                      id: event.card.id,
                      title: event.card.title,
                      description: event.card.description,
                      index: event.card.index,
                      cardLabels: [],
                    },
                  ],
                }
              : col
          )
        );
        break;

      case "card.updated":
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            cards: col.cards.map((card) =>
              card.id === event.card.id
                ? {
                    ...card,
                    title: event.card.title,
                    description: event.card.description,
                  }
                : card
            ),
          }))
        );
        break;

      case "card.deleted":
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            cards: col.cards.filter((card) => card.id !== event.cardId),
          }))
        );
        break;

      case "card.reordered":
        setColumns((prev) => {
          const newColumns = [...prev];
          for (const update of event.updates) {
            const col = newColumns.find((c) => c.id === update.columnId);
            if (col) {
              const card = col.cards.find((c) => c.id === update.id);
              if (card) {
                card.index = update.index;
              }
            }
          }
          return newColumns.map((col) => ({
            ...col,
            cards: reindexCards(col.cards),
          }));
        });
        break;

      case "label.toggled":
        // Atualização de labels será tratada pelo router.refresh()
        router.refresh();
        break;
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = React.useMemo(() => columns.map((c) => c.id), [columns]);

  const onDragStart = React.useCallback(
    ({ active }: any) => {
      const t = active?.data?.current?.type as "column" | "card" | undefined;
      if (t === "column") {
        const id = String(active.id);
        const col = columns.find((c) => c.id === id);
        if (col) setActiveDrag({ type: "column", id, title: col.title });
      } else if (t === "card") {
        const id = String(active.id);
        for (const col of columns) {
          const card = col.cards.find((c) => c.id === id);
          if (card) {
            setActiveDrag({
              type: "card",
              id,
              title: card.title,
              description: card.description ?? null,
            });
            break;
          }
        }
      }
    },
    [columns]
  );

  const onDragEnd = React.useCallback(
    (evt: DragEndEvent) => {
      const { active, over } = evt;
      setActiveDrag(null);
      if (!over) return;

      const activeType = active.data?.current?.type as
        | "column"
        | "card"
        | undefined;
      const overType = over.data?.current?.type as
        | "column"
        | "card"
        | undefined;

      // ===== COLUNAS =====
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

      // ===== CARDS =====
      const activeId = String(active.id);
      const overId = String(over.id);

      // drop em coluna vazia
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

      // card sobre card
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
    <>
      {/* Indicador de conexão em tempo real */}
      <div className="mb-4 flex items-center justify-between">
        <RealtimeStatus boardId={boardId} />
        <span className="text-xs text-muted-foreground">
          Alterações são sincronizadas automaticamente
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* SortableContext para COLUNAS */}
        <SortableContext items={columnIds} strategy={rectSortingStrategy}>
          <div
            role="list"
            aria-label="Quadro Kanban: colunas"
            className="flex flex-wrap gap-4 pb-2"
          >
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
                    <div
                      role="list"
                      aria-label={`Cards da coluna ${col.title}`}
                      className="space-y-2"
                    >
                      {col.cards.length === 0 ? (
                        <div
                          aria-label="Sem cards nesta coluna"
                          className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground"
                        >
                          Arraste cards para cá ou crie um novo abaixo
                        </div>
                      ) : (
                        col.cards.map((card) => (
                          <SortableCard key={card.id} id={card.id}>
                            <CardModal
                              card={card}
                              labels={labels}
                              trigger={
                                <div
                                  role="article"
                                  aria-roledescription="Card"
                                  aria-label={card.title}
                                  className="rounded-lg border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 text-sm group focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-150 hover:shadow-md cursor-pointer"
                                  tabIndex={0}
                                >
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

                                      {/* Labels */}
                                      {card.cardLabels &&
                                        card.cardLabels.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {card.cardLabels.map(
                                              (cardLabel) => {
                                                const label = labels.find(
                                                  (l) =>
                                                    l.id === cardLabel.labelId
                                                );
                                                if (!label) return null;

                                                return (
                                                  <span
                                                    key={cardLabel.labelId}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                      backgroundColor:
                                                        label.color + "20",
                                                      color: label.color,
                                                      border: `1px solid ${label.color}40`,
                                                    }}
                                                  >
                                                    {label.name}
                                                  </span>
                                                );
                                              }
                                            )}
                                          </div>
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
                                            aria-label={`Renomear card ${card.title}`}
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
                                            aria-label={`Excluir card ${card.title}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                          </SortableCard>
                        ))
                      )}
                    </div>
                  </SortableContext>

                  {/* Form de novo card */}
                  <div className="mt-4">
                    <CreateCardForm columnId={col.id} boardId={boardId} />
                  </div>
                </ColumnDropZone>
              </SortableColumn>
            ))}
          </div>
        </SortableContext>

        {/* GHOST/OVERLAY com skin */}
        <DragOverlay dropAnimation={null}>
          {activeDrag?.type === "column" ? (
            <div className="w-80 shrink-0 rounded-xl border bg-card/95 p-3 shadow-2xl opacity-90">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold">{activeDrag.title}</h3>
              </div>
              <div className="space-y-2">
                <div className="h-12 rounded-md border bg-background/60" />
                <div className="h-12 rounded-md border bg-background/60" />
              </div>
            </div>
          ) : activeDrag?.type === "card" ? (
            <div className="rounded-lg border bg-background/95 p-3 text-sm shadow-2xl opacity-90">
              <div className="font-medium truncate">{activeDrag.title}</div>
              {activeDrag.description && (
                <p className="mt-1 text-muted-foreground line-clamp-3">
                  {activeDrag.description}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

/* ---------- Zona droppable com highlight ---------- */
function ColumnDropZone({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-${columnId}` });
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label="Área de soltar cards"
      className={
        isOver ? "ring-2 ring-primary/40 rounded-md transition-all" : undefined
      }
    >
      {children}
    </div>
  );
}

/* ---------- Sortable Column com skin ---------- */
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
      role="region"
      aria-roledescription="Coluna do Kanban"
      aria-label={title}
      aria-grabbed={isDragging || undefined}
      tabIndex={0}
      className={[
        "w-80 shrink-0 rounded-xl border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 p-3",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "shadow-sm transition-all duration-150 hover:shadow-md",
        isDragging ? "scale-[.98] shadow-md" : "",
      ].join(" ")}
    >
      {/* Header da coluna com ações */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate font-semibold">{title}</h3>

        <div className="flex items-center gap-1">
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
                aria-label={`Renomear coluna ${title}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
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
                aria-label={`Excluir coluna ${title}`}
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

/* ---------- Sortable Card com skin ---------- */
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
    cursor: isDragging ? "grabbing" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-grabbed={isDragging || undefined}
      tabIndex={0}
      className={isDragging ? "scale-[.99] opacity-90" : ""}
    >
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
      index: c.index,
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
