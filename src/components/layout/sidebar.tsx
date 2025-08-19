"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // Opcional: página de boards gerais
  // { href: "/boards", label: "Boards", icon: Columns3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-dvh flex-col gap-2 p-3">
      <div className="px-2 py-3 text-sm font-semibold text-muted-foreground">
        Navegação
      </div>

      <div className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-2 pb-3 text-xs text-muted-foreground">
        v1.0 • CollabBoard
      </div>
    </nav>
  );
}
