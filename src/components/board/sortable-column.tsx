"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableColumnProps {
  id: string;
  title: string;
}

export function SortableColumn({ id, title }: SortableColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-64 rounded-md bg-neutral-100 dark:bg-neutral-800 p-3 shadow"
    >
      <h2 className="font-semibold mb-2">{title}</h2>
    </div>
  );
}
