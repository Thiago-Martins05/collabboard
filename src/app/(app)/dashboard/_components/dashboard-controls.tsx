"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";

export function DashboardControls() {
  return (
    <div className="flex items-center gap-3">
      {/* Busca */}
      <div className="hidden min-w-[280px] items-center gap-2 rounded-md border bg-background px-2 sm:flex">
        <Search className="h-4 w-4 text-muted-foreground" />
        <DashboardSearch />
      </div>

      {/* Toggle de tema e logout */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="outline"
          size="icon"
          aria-label="Sair"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function DashboardSearch() {
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
