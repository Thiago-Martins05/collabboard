"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
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
import { deleteCard, deleteColumn, editCard } from "./manage-actions";
import { RenameColumnDialog } from "./rename-column-dialog";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editCardSchema, type EditCardInput } from "./edit-schema";

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

  // estados para overlay e highlight
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    setColumns([...initialColumns].sort((a, b) => a.index - b.index));
  }, [initialColumns]);

  const columnIds = useMemo(() => columns.map((c) => colKey(c.id)), [columns]);

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (!isCardKey(id)) return;
    const cardId = parseCardId(id);
    const col = columns.find((c) => c.cards.some((cd) => cd.id === cardId));
    const card = col?.cards.find((cd) => cd.id === cardId) || null;
    setActiveCard(card);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setOverColumnId(null);
    setActiveCard(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Reordenar colunas
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

    // Reordenar/mover cards
    if (isCardKey(activeId)) {
      const cardId = parseCardId(activeId);

      const fromCol = columns.find((c) =>
        c.cards.some((card) => card.id === cardId)
      );
      if (!fromCol) return;

      let toCol: Column | undefined;
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

      const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));

      const from = next.find((c) => c.id === fromCol.id)!;
      const oldIdx = from.cards.findIndex((card) => card.id === cardId);
      const [moved] = from.cards.splice(oldIdx, 1);

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

      const dest = next.find((c) => c.id === toCol.id)!;
      dest.cards.splice(newIdx, 0, moved);

      from.cards = from.cards.map((card, i) => ({ ...card, index: i }));
      dest.cards = dest.cards.map((card, i) => ({ ...card, index: i }));

      setColumns(next);

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
      onDragStart={onDragStart}
      onDragOver={(e) => {
        const overId = e.over ? String(e.over.id) : null;
        if (!overId) return setOverColumnId(null);
        if (isColKey(overId)) return setOverColumnId(parseColId(overId));
        if (isCardKey(overId)) {
          const cid = parseCardId(overId);
          const col = columns.find((c) => c.cards.some((cd) => cd.id === cid));
          return setOverColumnId(col?.id || null);
        }
        setOverColumnId(null);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar cards por título ou descrição..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filtrar cards"
        />
      </div>
      <SortableContext items={columnIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap gap-4 pb-6 pt-1">
          {columns.map((col) => (
            <SortableColumn
              key={col.id}
              id={col.id}
              title={col.title}
              boardId={boardId}
              isOver={overColumnId === col.id}
            >
              <SortableContext
                items={col.cards.map((card) => cardKey(card.id))}
                strategy={rectSortingStrategy}
              >
                <ul
                  className="space-y-2 min-h-[2.5rem] transition-colors"
                  role="list"
                >
                  {col.cards
                    .filter((c) => {
                      if (!query.trim()) return true;
                      const q = query.toLowerCase();
                      return (
                        c.title.toLowerCase().includes(q) ||
                        (c.description
                          ? c.description.toLowerCase().includes(q)
                          : false)
                      );
                    })
                    .sort((a, b) => a.index - b.index)
                    .map((card) => (
                      <li key={card.id}>
                        <SortableCard
                          id={card.id}
                          title={card.title}
                          description={card.description}
                          boardId={boardId}
                        />
                      </li>
                    ))}
                </ul>
              </SortableContext>

              <div className="mt-4">
                <CreateCardForm boardId={boardId} columnId={col.id} />
              </div>
            </SortableColumn>
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay (ghost do card) */}
      <DragOverlay>
        {activeCard ? (
          <div className="rounded-md border bg-background p-3 text-sm shadow-lg">
            <div className="font-medium">{activeCard.title}</div>
            {activeCard.description ? (
              <p className="mt-1 text-muted-foreground">
                {activeCard.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ================= Column ================= */

function SortableColumn({
  id,
  title,
  children,
  boardId,
  isOver,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  boardId: string;
  isOver?: boolean;
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
    <section
      ref={setNodeRef}
      style={style}
      className={`w-full sm:w-[calc(50%-0.5rem)] lg:w-72 shrink-0 rounded-lg border bg-card/95 p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[12rem]
      ${isOver ? "ring-2 ring-primary/60 border-primary/50" : ""}`}
      role="group"
      aria-labelledby={`col-${id}-title`}
      tabIndex={0}
    >
      <div className="mb-3 flex items-center justify-between select-none">
        {/* drag handle no título */}
        <h2
          id={`col-${id}-title`}
          className="
            text-sm font-semibold tracking-tight text-foreground
            cursor-grab active:cursor-grabbing
          "
          {...attributes}
          {...listeners}
        >
          {title}
        </h2>

        <div className="flex items-center gap-1">
          {/* editar coluna */}
          <RenameColumnDialog
            boardId={boardId}
            columnId={id}
            currentTitle={title}
            trigger={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
                aria-label="Renomear coluna"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />

          {/* apagar coluna */}
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
      </div>

      {children}
    </section>
  );
}

/* ================= Card ================= */

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
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
        rounded-md border bg-background p-3 text-sm
        cursor-grab active:cursor-grabbing
        outline-none focus-visible:ring-2 focus-visible:ring-ring
        hover:bg-accent/30 transition-colors
        shadow-xs min-h-[3rem]
      "
      aria-roledescription="Cartão Kanban"
      aria-label={title}
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium leading-tight">{title}</h3>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* editar card */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="shrink-0 rounded p-1 hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
                aria-label="Editar card"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Editar card</DialogTitle>
              </DialogHeader>
              <EditCardForm
                boardId={boardId}
                cardId={id}
                defaultTitle={title}
                defaultDescription={description || ""}
              />
            </DialogContent>
          </Dialog>

          {/* apagar card */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="shrink-0 rounded p-1 hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
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
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirmDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}

/* ====== Form de edição do Card ====== */
function EditCardForm({
  boardId,
  cardId,
  defaultTitle,
  defaultDescription,
}: {
  boardId: string;
  cardId: string;
  defaultTitle: string;
  defaultDescription: string;
}) {
  const form = useForm<EditCardInput>({
    resolver: zodResolver(editCardSchema),
    defaultValues: { title: defaultTitle, description: defaultDescription },
  });
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        start(async () => {
          const res = await editCard(boardId, cardId, fd);
          if (!res.ok) {
            form.setError("title", { message: res.error || "Erro" });
          } else {
            router.refresh();
          }
        });
      }}
    >
      <Input placeholder="Título" {...form.register("title")} />
      <Textarea
        placeholder="Descrição"
        rows={4}
        {...form.register("description")}
      />
      {form.formState.errors.title && (
        <p className="text-sm text-red-500">
          {form.formState.errors.title.message}
        </p>
      )}
      <Button type="submit">Salvar</Button>
    </form>
  );
}
