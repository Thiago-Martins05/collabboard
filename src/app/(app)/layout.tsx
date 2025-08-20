import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        {/* Aside */}
        <aside className="hidden md:block border-r bg-card">
          <Sidebar />
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
