"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Apaga um card pelo id (reindexa a coluna) */
export async function deleteCard(boardId: string, cardId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const card = await db.card.findUnique({
    where: { id: cardId },
    select: { id: true, columnId: true, column: { select: { boardId: true } } },
  });
  if (!card || card.column.boardId !== boardId) {
    return { ok: false, error: "Card inválido." };
  }

  await db.$transaction(async (tx) => {
    await tx.card.delete({ where: { id: cardId } });

    // reindexa os restantes da coluna
    const rest = await tx.card.findMany({
      where: { columnId: card.columnId },
      orderBy: { index: "asc" },
      select: { id: true },
    });
    await Promise.all(
      rest.map((c, i) =>
        tx.card.update({ where: { id: c.id }, data: { index: i } })
      )
    );
  });

  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}

/** Apaga uma coluna (e todos os cards dela), reindexa colunas */
export async function deleteColumn(boardId: string, columnId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const col = await db.column.findUnique({
    where: { id: columnId },
    select: { id: true, boardId: true },
  });
  if (!col || col.boardId !== boardId) {
    return { ok: false, error: "Coluna inválida." };
  }

  await db.$transaction(async (tx) => {
    // apaga os cards primeiro (pois relação não está em cascade)
    await tx.card.deleteMany({ where: { columnId } });
    await tx.column.delete({ where: { id: columnId } });

    // reindexa as demais colunas
    const rest = await tx.column.findMany({
      where: { boardId },
      orderBy: { index: "asc" },
      select: { id: true },
    });
    await Promise.all(
      rest.map((c, i) =>
        tx.column.update({ where: { id: c.id }, data: { index: i } })
      )
    );
  });

  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}
