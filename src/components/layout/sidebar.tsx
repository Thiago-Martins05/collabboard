"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // Opcional: página de boards gerais
  // { href: "/boards", label: "Boards", icon: Columns3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-dvh flex-col gap-4 p-4">
      {/* Logo/Brand */}
      <div className="px-2 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src="/collabboard-logo.png"
              alt="CollabBoard Logo"
              width={40}
              height={40}
              className="rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
              CollabBoard
            </h1>
            <p className="text-xs text-muted-foreground">Kanban colaborativo</p>
          </div>
        </div>
      </div>

      <div className="px-2 py-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navegação
        </div>
      </div>

      <div className="space-y-2 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200",
                "hover:bg-accent/80 hover:text-accent-foreground hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                active
                  ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                )}
              />
              <span className="truncate font-medium">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-2 pb-4">
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <div className="text-xs text-muted-foreground font-medium">
            CollabBoard
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            v1.0 • Kanban colaborativo
          </div>
        </div>
      </div>
    </nav>
  );
}
