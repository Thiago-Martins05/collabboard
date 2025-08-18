import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function BoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  const board = await db.board.findUnique({
    where: { id: params.boardId },
    include: {
      columns: {
        include: { cards: true },
        orderBy: { index: "asc" },
      },
    },
  });

  if (!board) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{board.title}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {board.columns.map((col) => (
          <div key={col.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {col.title}
            </h2>
            <div className="space-y-2">
              {col.cards
                .sort((a, b) => a.index - b.index)
                .map((card) => (
                  <div
                    key={card.id}
                    className="rounded-md border bg-background p-3 text-sm"
                  >
                    <div className="font-medium">{card.title}</div>
                    {card.description && (
                      <p className="mt-1 text-muted-foreground">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
