import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { ensureOwnerMembership } from "@/lib/rbac";
import { getOrganizationUsage } from "@/lib/limits";
import { LimitsBanner } from "@/components/limits-banner";
import { CreateBoardForm } from "./create-board-form";
import { DeleteBoardButton } from "./delete-board-button";
import { RenameBoardButton } from "./rename-board-button";
import { DashboardControls } from "./_components/dashboard-controls";
import { Columns3, Users, Zap } from "lucide-react";
import Image from "next/image";

type Search = {
  q?: string;
  order?: "createdDesc" | "createdAsc" | "titleAsc" | "titleDesc";
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();
  const order = (sp?.order as Search["order"]) ?? "createdDesc";

  const session = await getSession();
  if (!session?.user?.email) return null;

  // 🔹 Auto-provisiona org pessoal e garante membership OWNER
  const org = await ensureUserPrimaryOrganization();
  if (org?.id) {
    await ensureOwnerMembership(org.id);
  }

  const orderBy =
    order === "createdAsc"
      ? { createdAt: "asc" as const }
      : order === "titleAsc"
      ? { title: "asc" as const }
      : order === "titleDesc"
      ? { title: "desc" as const }
      : { createdAt: "desc" as const };

  const boards = await db.board.findMany({
    where: {
      ...(org?.id ? { organizationId: org.id } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy,
    include: { columns: true },
  });

  // Obtém estatísticas de uso da organização
  const usage = org?.id ? await getOrganizationUsage(org.id) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header com branding */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative w-12 h-12">
            <Image
              src="/collabboard-logo.png"
              alt="CollabBoard Logo"
              width={48}
              height={48}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Gerencie seus quadros Kanban e organize suas tarefas
        </p>
        {org?.name && (
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Organização: {org.name}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-end">
        <DashboardControls />
      </div>

      {/* Banner de limites - apenas quando próximo ou no limite */}
      {usage && (
        <div className="space-y-3">
          {/* Mostra banner de boards apenas se próximo do limite (80%) ou no limite */}
          {usage.boards.max > 0 &&
            (usage.boards.current >= usage.boards.max ||
              usage.boards.current / usage.boards.max >= 0.8) && (
              <LimitsBanner
                feature="boards"
                current={usage.boards.current}
                max={usage.boards.max}
              />
            )}

          {/* Mostra banner de membros apenas se próximo do limite (80%) ou no limite */}
          {usage.members.max > 0 &&
            (usage.members.current >= usage.members.max ||
              usage.members.current / usage.members.max >= 0.8) && (
              <LimitsBanner
                feature="membros"
                current={usage.members.current}
                max={usage.members.max}
              />
            )}
        </div>
      )}

      {/* Criar novo board */}
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
        <CreateBoardForm />
      </div>

      {boards.length === 0 ? (
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-12 text-center shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Columns3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {q
                  ? "Nenhum board encontrado"
                  : "Comece criando seu primeiro board"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {q
                  ? "Tente ajustar os termos de busca."
                  : "Crie um novo quadro Kanban para organizar suas tarefas de forma visual. 🚀"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Columns3 className="h-4 w-4" />
            {boards.length} board{boards.length !== 1 ? "s" : ""} encontrado
            {boards.length !== 1 ? "s" : ""}
          </div>

          <div className="grid gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-muted/50 hover:border-muted"
              >
                {/* Gradiente sutil no fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"></div>

                <div className="relative flex items-center justify-between z-10">
                  <Link
                    href={`/boards/${board.id}`}
                    className="flex-1 hover:underline"
                  >
                    <div className="font-bold text-lg text-foreground/90 group-hover:text-foreground transition-colors">
                      {board.title}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Columns3 className="h-4 w-4" />
                        {board.columns.length} coluna
                        {board.columns.length !== 1 ? "s" : ""}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                      <div className="text-sm text-muted-foreground">
                        Criado em{" "}
                        {new Date(board.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 opacity-100 transition-all duration-200 z-10">
                    <RenameBoardButton
                      boardId={board.id}
                      boardTitle={board.title}
                    />
                    <DeleteBoardButton
                      boardId={board.id}
                      boardTitle={board.title}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
