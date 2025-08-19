"use server";

import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { renameSchema, editCardSchema } from "./edit-schema";

/** Apagar card (reindexa coluna) */
export async function deleteCard(boardId: string, cardId: string) {
  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        columnId: true,
        column: {
          select: {
            boardId: true,
            board: { select: { organizationId: true } },
          },
        },
      },
    });
    if (!card || card.column.boardId !== boardId) {
      throw new Error("Card inválido.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    await db.$transaction(async (tx) => {
      await tx.card.delete({ where: { id: cardId } });
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
  });
}

/** Apagar coluna (e cards), reindexa colunas */
export async function deleteColumn(boardId: string, columnId: string) {
  return withRbacGuard(async () => {
    const col = await db.column.findUnique({
      where: { id: columnId },
      select: {
        id: true,
        boardId: true,
        board: { select: { organizationId: true } },
      },
    });
    if (!col || col.boardId !== boardId) {
      throw new Error("Coluna inválida.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(col.board.organizationId);

    await db.$transaction(async (tx) => {
      await tx.card.deleteMany({ where: { columnId } });
      await tx.column.delete({ where: { id: columnId } });
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
  });
}

/** Renomear board */
export async function renameBoard(boardId: string, data: FormData) {
  const parsed = renameSchema.safeParse({
    title: String(data.get("title") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  return withRbacGuard(async () => {
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });
    if (!board) {
      throw new Error("Board não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(board.organizationId);

    await db.board.update({
      where: { id: boardId },
      data: { title: parsed.data.title },
    });
    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}

/** Renomear coluna */
export async function renameColumn(
  boardId: string,
  columnId: string,
  data: FormData
) {
  const parsed = renameSchema.safeParse({
    title: String(data.get("title") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  return withRbacGuard(async () => {
    const col = await db.column.findUnique({
      where: { id: columnId },
      select: { boardId: true, board: { select: { organizationId: true } } },
    });
    if (!col || col.boardId !== boardId) {
      throw new Error("Coluna inválida.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(col.board.organizationId);

    await db.column.update({
      where: { id: columnId },
      data: { title: parsed.data.title },
    });
    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}

/** Editar card (título/descrição) */
export async function editCard(
  boardId: string,
  cardId: string,
  data: FormData
) {
  const parsed = editCardSchema.safeParse({
    title: String(data.get("title") || ""),
    description: String(data.get("description") || ""),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message || "Inválido" };

  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      select: {
        column: {
          select: {
            boardId: true,
            board: { select: { organizationId: true } },
          },
        },
      },
    });
    if (!card || card.column.boardId !== boardId) {
      throw new Error("Card inválido.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    await db.card.update({
      where: { id: cardId },
      data: { title: parsed.data.title, description: parsed.data.description },
    });
    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}
