// src/app/(app)/boards/[boardId]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Kanban } from "./kanban";
import { CreateColumnForm } from "./create-column-form";
import { RenameBoardDialog } from "./rename-board-dialog";
import { renameBoard } from "./manage-actions";
import { Button } from "@/components/ui/button";
import { Pencil, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ManageLabelsDialog } from "./manage-labels-dialog";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        include: {
          cards: {
            include: {
              cardLabels: true,
            },
          },
        },
      },
      labels: true,
    },
  });
  if (!board) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">{board.title}</h1>
          <RenameBoardDialog
            boardId={board.id}
            initial={board.title}
            trigger={
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <ManageLabelsDialog
            boardId={board.id}
            labels={board.labels}
            trigger={
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        <CreateColumnForm />
      </div>

      <Kanban
        boardId={board.id}
        columns={board.columns}
        labels={board.labels}
      />
    </div>
  );
}
