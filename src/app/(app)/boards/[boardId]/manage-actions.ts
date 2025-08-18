"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { renameSchema, editCardSchema } from "./edit-schema";

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

/** Renomear board */
export async function renameBoard(boardId: string, data: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const parsed = renameSchema.safeParse({
    title: String(data.get("title") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  await db.board.update({
    where: { id: boardId },
    data: { title: parsed.data.title },
  });
  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}

/** Renomear coluna */
export async function renameColumn(
  boardId: string,
  columnId: string,
  data: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const col = await db.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  if (!col || col.boardId !== boardId)
    return { ok: false, error: "Coluna inválida." };

  const parsed = renameSchema.safeParse({
    title: String(data.get("title") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  await db.column.update({
    where: { id: columnId },
    data: { title: parsed.data.title },
  });
  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}

/** Editar card (título/descrição) */
export async function editCard(
  boardId: string,
  cardId: string,
  data: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

  const card = await db.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  });
  if (!card || card.column.boardId !== boardId)
    return { ok: false, error: "Card inválido." };

  const parsed = editCardSchema.safeParse({
    title: String(data.get("title") || ""),
    description: String(data.get("description") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  await db.card.update({
    where: { id: cardId },
    data: { title: parsed.data.title, description: parsed.data.description },
  });
  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}
