"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="text-base font-semibold">CollabBoard</div>

        {/* Busca no header */}
        <div className="ml-auto hidden min-w-[280px] items-center gap-2 rounded-md border bg-background px-2 sm:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <HeaderSearch />
        </div>
      </div>
    </header>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  // mantém o input sincronizado quando a URL muda
  useEffect(() => {
    setQ(sp.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.get("q")]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(sp.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 items-center gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar boards…"
        className="h-8 border-0 shadow-none focus-visible:ring-0"
      />
      <Button type="submit" size="sm" variant="secondary" className="h-8">
        Buscar
      </Button>
    </form>
  );
}
