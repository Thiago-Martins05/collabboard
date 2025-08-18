import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateBoardForm } from "./create-board-form";
import { getUserPrimaryOrganization } from "@/lib/tenant";
import Link from "next/link";
import { Separator } from "@radix-ui/react-select";
import { DeleteBoardButton } from "./delete-board-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const org = session?.user?.id
    ? await getUserPrimaryOrganization(session.user.id as string)
    : null;

  const boards = await db.board.findMany({
    where: { organizationId: org.id },
    include: { columns: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <CreateBoardForm />

      {boards.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Você ainda não tem boards. Crie o primeiro acima. 🚀
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
