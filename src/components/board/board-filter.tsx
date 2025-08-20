"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BoardFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resultCount?: number;
  totalCount?: number;
}

export function BoardFilter({
  searchTerm,
  onSearchChange,
  resultCount,
  totalCount,
}: BoardFilterProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Foco automático no input quando o componente monta
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Atalho de teclado: Ctrl+K para focar no filtro
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Buscar cards..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-72 bg-background/80 border-muted/50 focus:border-blue-500/50 focus:ring-blue-500/20"
        aria-label="Buscar cards"
      />

      {searchTerm && (
        <Badge variant="secondary" className="whitespace-nowrap">
          {resultCount !== undefined && totalCount !== undefined
            ? `${resultCount}/${totalCount}`
            : "Filtrado"}
        </Badge>
      )}
    </div>
  );
}

// Componente para destacar texto que corresponde à busca
export function HighlightedText({
  text,
  searchTerm,
  className = "",
}: {
  text: string;
  searchTerm: string;
  className?: string;
}) {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
