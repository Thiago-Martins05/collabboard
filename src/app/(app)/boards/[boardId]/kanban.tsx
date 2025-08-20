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
  DragStartEvent,
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
import { Pencil, Trash2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
import { BoardFilter, HighlightedText } from "@/components/board/board-filter";

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

  // Estado de filtro
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(
    () => setColumns(normalize(initialColumns)),
    [initialColumns]
  );

  // Função para verificar se um card corresponde ao filtro
  const cardMatchesFilter = React.useCallback(
    (card: CardDTO) => {
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();

      // Busca no título
      if (card.title.toLowerCase().includes(term)) return true;

      // Busca na descrição
      if (card.description?.toLowerCase().includes(term)) return true;

      // Busca nas labels
      if (card.cardLabels) {
        for (const cardLabel of card.cardLabels) {
          const label = labels.find((l) => l.id === cardLabel.labelId);
          if (label && label.name.toLowerCase().includes(term)) return true;
        }
      }

      return false;
    },
    [searchTerm, labels]
  );

  // Colunas filtradas
  const filteredColumns = React.useMemo(() => {
    if (!searchTerm.trim()) return columns;

    return columns.map((col) => ({
      ...col,
      cards: col.cards.filter(cardMatchesFilter),
    }));
  }, [columns, searchTerm, cardMatchesFilter]);

  // Contadores para o filtro
  const totalCards = React.useMemo(
    () => columns.reduce((sum, col) => sum + col.cards.length, 0),
    [columns]
  );

  const filteredCards = React.useMemo(
    () => filteredColumns.reduce((sum, col) => sum + col.cards.length, 0),
    [filteredColumns]
  );

  // Hook de tempo real
  useRealtimeBoard(boardId, (event) => {
    // Atualiza o estado baseado no tipo de evento
    switch (event.type) {
      case "column.created":
        setColumns((prev) => [
          ...prev,
          {
            id: event.column.id,
            title: event.column.title,
            index: event.column.index,
            cards: [],
          },
        ]);
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
    ({ active }: DragStartEvent) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/30 dark:bg-purple-900/10 blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Header com filtro e status de tempo real */}
        <div className="mb-6 space-y-4">
          {/* Filtro de busca com design inspirado no login */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/collabboard-logo.png"
                  alt="CollabBoard Logo"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                  Quadro Kanban
                </h2>
                <p className="text-sm text-muted-foreground">
                  Organize suas tarefas de forma visual
                </p>
              </div>
            </div>
            <RealtimeStatus boardId={boardId} />
          </div>

          {/* Filtro de busca estilizado */}
          <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg">
            <BoardFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              resultCount={filteredCards}
              totalCount={totalCards}
            />
          </div>

          {/* Status de tempo real */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Alterações são sincronizadas automaticamente
            </span>
            {searchTerm && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                Mostrando {filteredCards} de {totalCards} cards
              </span>
            )}
          </div>
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
              className="flex flex-wrap gap-6 pb-4"
            >
              {filteredColumns.map((col) => (
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
                        className="space-y-3"
                      >
                        {col.cards.length === 0 ? (
                          <div
                            aria-label="Sem cards nesta coluna"
                            className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-6 text-center"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-muted-foreground/30"></div>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">
                                Arraste cards para cá
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                ou crie um novo abaixo
                              </p>
                            </div>
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
                                    className="group relative rounded-xl border bg-card/90 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-muted/50 hover:border-muted"
                                    tabIndex={0}
                                  >
                                    {/* Gradiente sutil no fundo */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                                    <div className="relative flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors">
                                          <HighlightedText
                                            text={card.title}
                                            searchTerm={searchTerm}
                                          />
                                        </div>
                                        {card.description && (
                                          <p className="mt-2 text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                                            <HighlightedText
                                              text={card.description}
                                              searchTerm={searchTerm}
                                            />
                                          </p>
                                        )}

                                        {/* Labels com design melhorado */}
                                        {card.cardLabels &&
                                          card.cardLabels.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
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
                                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border"
                                                      style={{
                                                        backgroundColor:
                                                          label.color + "15",
                                                        color: label.color,
                                                        borderColor:
                                                          label.color + "30",
                                                      }}
                                                    >
                                                      <HighlightedText
                                                        text={label.name}
                                                        searchTerm={searchTerm}
                                                      />
                                                    </span>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}
                                      </div>

                                      <div className="flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
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
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              aria-label={`Renomear card ${card.title}`}
                                              className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
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
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              aria-label={`Excluir card ${card.title}`}
                                              className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* GHOST/OVERLAY com skin melhorado */}
          <DragOverlay dropAnimation={null}>
            {activeDrag?.type === "column" ? (
              <div className="w-80 shrink-0 rounded-2xl border bg-card/95 backdrop-blur-sm p-4 shadow-2xl opacity-90 ring-2 ring-blue-500/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                    {activeDrag.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="h-12 rounded-xl border bg-background/60" />
                  <div className="h-12 rounded-xl border bg-background/60" />
                </div>
              </div>
            ) : activeDrag?.type === "card" ? (
              <div className="rounded-xl border bg-card/95 backdrop-blur-sm p-4 text-sm shadow-2xl opacity-90 ring-2 ring-blue-500/20 max-w-sm">
                <div className="font-semibold truncate">{activeDrag.title}</div>
                {activeDrag.description && (
                  <p className="mt-2 text-muted-foreground line-clamp-3 text-xs">
                    {activeDrag.description}
                  </p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

/* ---------- Zona droppable com highlight melhorado ---------- */
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
        isOver
          ? "ring-2 ring-blue-500/40 rounded-xl transition-all duration-200 bg-blue-50/50 dark:bg-blue-950/20"
          : undefined
      }
    >
      {children}
    </div>
  );
}

/* ---------- Sortable Column com skin inspirado no login ---------- */
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
        "w-80 shrink-0 rounded-2xl border bg-card/90 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 p-4",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "shadow-lg transition-all duration-200 hover:shadow-xl",
        "border-muted/50 hover:border-muted",
        isDragging ? "scale-[.98] shadow-2xl ring-2 ring-blue-500/20" : "",
      ].join(" ")}
    >
      {/* Header da coluna com ações */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="truncate font-bold text-lg bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
          {title}
        </h3>

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
                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
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
                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
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

/* ---------- Sortable Card com skin melhorado ---------- */
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
      className={isDragging ? "scale-[.99] opacity-90 rotate-1" : ""}
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
