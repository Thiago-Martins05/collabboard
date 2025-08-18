"use client";

import { useState } from "react";
import { DndWrapper } from "./dnd-context";
import { SortableColumn } from "./sortable-column";
import { rectSortingStrategy } from "@dnd-kit/sortable";

interface Column {
  id: string;
  title: string;
}

const initialColumns: Column[] = [
  { id: "todo", title: "A Fazer" },
  { id: "doing", title: "Fazendo" },
  { id: "done", title: "Feito" },
];

export function Board() {
  const [columns, setColumns] = useState(initialColumns);

  return (
    <DndWrapper
      items={columns.map((c) => c.id)}
      onChange={(ids) =>
        setColumns(ids.map((id) => columns.find((c) => c.id === id)!))
      }
    >
      <div className="flex gap-4">
        {columns.map((column) => (
          <SortableColumn key={column.id} id={column.id} title={column.title} />
        ))}
      </div>
    </DndWrapper>
  );
}
