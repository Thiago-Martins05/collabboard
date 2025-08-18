import Link from "next/link";
import { db } from "@/lib/db";
import { CreateBoardForm } from "./create-board-form";
import { DeleteBoardButton } from "./delete-board-button";
import { DashboardFilters } from "./filters";
import { getSession } from "@/lib/session";
import { getUserPrimaryOrganization } from "@/lib/tenant";

type PageProps = {
  searchParams?: {
    q?: string;
    order?: "createdDesc" | "createdAsc" | "titleAsc" | "titleDesc";
  };
};

export default async function DashboardPage({ searchParams }: PageProps) {
  // ---- sessão + org do usuário ----
  const session = await getSession();
  if (!session?.user?.id) {
    // Se sua rota /dashboard já estiver protegida por middleware, isso nunca acontece.
    // Se preferir, redirecione para /sign-in aqui.
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Acesso restrito</h1>
        <p className="text-muted-foreground">
          Faça login para acessar o dashboard.
        </p>
      </div>
    );
  }

  const org = await getUserPrimaryOrganization(session.user.id as string);

  // ---- filtros vindos da URL ----
  const q = (searchParams?.q ?? "").trim();
  const order = searchParams?.order ?? "createdDesc";

  // ---- ordenação ----
  const orderBy =
    order === "createdAsc"
      ? { createdAt: "asc" as const }
      : order === "titleAsc"
      ? { title: "asc" as const }
      : order === "titleDesc"
      ? { title: "desc" as const }
      : { createdAt: "desc" as const }; // createdDesc (default)

  // ---- query de boards ----
  const whereClause = {
    ...(org?.id ? { organizationId: org.id } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const boards = await db.board.findMany({
    where: whereClause,
    include: { columns: true },
    orderBy,
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* Caso queira exibir a org ativa */}
        {org?.name && (
          <span className="text-sm text-muted-foreground">
            Organização: {org.name}
          </span>
        )}
      </div>

      {/* filtros (busca + ordenação) */}
      <DashboardFilters />

      {/* criar board */}
      <CreateBoardForm />

      {/* listagem / empty state */}
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
