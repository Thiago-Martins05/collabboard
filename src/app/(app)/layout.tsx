import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/session";
import { getUserPrimaryOrganization } from "@/lib/tenant";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  let orgName: string | null = null;

  if (session?.user?.id) {
    const org = await getUserPrimaryOrganization(session.user.id as string);
    orgName = org?.name ?? null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar orgName={orgName} />
      <div className="flex flex-1 flex-col">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
