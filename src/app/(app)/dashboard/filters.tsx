"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [order, setOrder] = useState(params.get("order") ?? "createdDesc");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setOrder(params.get("order") ?? "createdDesc");
  }, [params]);

  function push(nextQ: string, nextOrder: string) {
    const s = new URLSearchParams();
    if (nextQ) s.set("q", nextQ);
    if (nextOrder && nextOrder !== "createdDesc") s.set("order", nextOrder);
    const query = s.toString();
    startTransition(() => router.push(`/dashboard${query ? `?${query}` : ""}`));
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-2">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Procure por título..."
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            // pequena “debounce” manual
            window.clearTimeout((window as any).__db_to);
            (window as any).__db_to = window.setTimeout(
              () => push(v, order),
              250
            );
          }}
        />
      </div>

      <div>
        <Label>Ordenar por</Label>
        <Select
          value={order}
          onValueChange={(v) => {
            setOrder(v);
            push(q, v);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdDesc">Mais recentes</SelectItem>
            <SelectItem value="createdAsc">Mais antigos</SelectItem>
            <SelectItem value="titleAsc">Título A–Z</SelectItem>
            <SelectItem value="titleDesc">Título Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
