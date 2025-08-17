"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav } from "@/config/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r bg-sidebar text-sidebar-foreground md:block md:w-60">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        CollabBoard
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
