import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/session";
import { getUserPrimaryOrganization } from "@/lib/tenant";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  let orgName: string | null = null;

  if (session?.user?.id) {
    const org = await getUserPrimaryOrganization(session.user.id as string);
    orgName = org?.name ?? null;
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-[240px_1fr]">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Header orgName={orgName ?? "Meu workspace"} />
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
