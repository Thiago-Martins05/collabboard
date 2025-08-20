"use client";

import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/collabboard-logo.png"
              alt="CollabBoard Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>
          <div className="text-lg font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
            CollabBoard
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-muted/80"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-muted/80"
          >
            <User className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
