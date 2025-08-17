"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      {/* Logo / título */}
      <Link href="/dashboard" className="font-semibold">
        CollabBoard
      </Link>

      {/* Busca */}
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 rounded-md border bg-background px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="h-8 w-56 border-0 focus-visible:ring-0"
            placeholder="Buscar boards…"
          />
        </div>

        {/* Toggle de tema */}
        <ThemeToggle />

        {/* Placeholder de usuário */}
        <Button variant="secondary" className="h-8 px-3">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
            TL
          </span>
          Minha conta
        </Button>
      </div>
    </header>
  );
}
