import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Kanban } from "./kanban";
import { CreateColumnForm } from "./create-column-form";

export default async function BoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  const board = await db.board.findUnique({
    where: { id: params.boardId },
    include: { columns: { include: { cards: true } } },
  });
  if (!board) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{board.title}</h1>
        <CreateColumnForm boardId={board.id} />
      </div>

      {/* ✅ apenas o Kanban com DnD + forms embutidos */}
      <Kanban boardId={board.id} columns={board.columns} />
    </div>
  );
}
