"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function reorderColumns(boardId: string, orderedIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  // valida se todos os IDs pertencem ao board
  const existing = await db.column.findMany({
    where: { boardId },
    select: { id: true },
  });
  const validIds = new Set(existing.map((c) => c.id));
  if (!orderedIds.every((id) => validIds.has(id))) {
    return { ok: false, error: "IDs de coluna inválidos." };
  }

  // atualiza índices em transação
  await db.$transaction(
    orderedIds.map((id, idx) =>
      db.column.update({ where: { id }, data: { index: idx } })
    )
  );

  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}
