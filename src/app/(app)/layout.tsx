import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[240px_1fr]">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Header />
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
