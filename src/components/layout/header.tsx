// src/components/layout/header.tsx
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Link href="/dashboard" className="font-semibold">
        CollabBoard
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 rounded-md border bg-background px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="h-8 w-56 border-0 focus-visible:ring-0"
            placeholder="Buscar boards…"
          />
        </div>

        <ThemeToggle />

        <Button
          variant="secondary"
          className="h-8 px-3"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
