import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Kanban } from "./kanban";
import { CreateColumnForm } from "./create-column-form";
import { RenameDialog } from "./rename-dialog";
import { renameBoard } from "./manage-actions";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{board.title}</h1>
          <RenameDialog
            initial={board.title}
            onSubmit={(fd) => renameBoard(board.id, fd)}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Renomear board"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <CreateColumnForm boardId={board.id} />
      </div>

      <Kanban boardId={board.id} columns={board.columns} />
    </div>
  );
}
