import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateBoardForm } from "./create-board-form";
import { getUserPrimaryOrganization } from "@/lib/tenant";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const org = session?.user?.id
    ? await getUserPrimaryOrganization(session.user.id as string)
    : null;

  let boards = [];
  if (org?.id) {
    boards = await db.board.findMany({
      where: { organizationId: org.id },
      include: { columns: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <CreateBoardForm />

      <div className="space-y-3">
        {boards.map((board) => (
          <div key={board.id} className="rounded border p-4 bg-card shadow-sm">
            <h2 className="font-semibold">{board.title}</h2>
            <p className="text-sm text-muted-foreground">
              {board.columns.length} colunas
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
