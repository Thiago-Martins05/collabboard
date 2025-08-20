import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/30 dark:bg-purple-900/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200/20 to-purple-200/20 dark:from-blue-800/10 dark:to-purple-800/10 blur-3xl"></div>
      </div>

      <div className="relative min-h-dvh">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          {/* Aside */}
          <aside className="hidden md:block border-r bg-card/80 backdrop-blur-sm supports-[backdrop-filter]:bg-card/60">
            <Sidebar />
          </aside>

          {/* Conteúdo */}
          <div className="flex min-h-dvh flex-col">
            <Header />
            <main className="flex-1 relative z-10">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
