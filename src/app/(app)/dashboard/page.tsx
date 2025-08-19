import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { ensureOwnerMembership } from "@/lib/rbac";
import { CreateBoardForm } from "./create-board-form";
import { DeleteBoardButton } from "./delete-board-button";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {org?.name && (
          <span className="text-sm text-muted-foreground">Org: {org.name}</span>
        )}
      </div>

      {/* Criar novo board */}
      <CreateBoardForm />

      {boards.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {q
              ? "Nenhum board encontrado para sua busca."
              : "Você ainda não tem boards. Crie o primeiro acima. 🚀"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="flex items-center justify-between rounded border bg-card p-4 shadow-sm"
            >
              <Link
                href={`/boards/${board.id}`}
                className="flex-1 hover:underline"
              >
                <div className="font-semibold">{board.title}</div>
                <p className="text-sm text-muted-foreground">
                  {board.columns.length} colunas
                </p>
              </Link>

              <DeleteBoardButton boardId={board.id} boardTitle={board.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
