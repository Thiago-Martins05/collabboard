"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

/** Reordenar colunas (horizontal) */
export async function reorderColumns(boardId: string, orderedIds: string[]) {
  return withRbacGuard(async () => {
    // Busca o board e verifica se o usuário tem acesso
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });
    if (!board) {
      throw new Error("Board não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(board.organizationId);

    // valida IDs pertencentes ao board
    const existing = await db.column.findMany({
      where: { boardId },
      select: { id: true },
    });
    const validIds = new Set(existing.map((c) => c.id));
    if (!orderedIds.every((id) => validIds.has(id))) {
      throw new Error("IDs de coluna inválidos.");
    }

    // atualiza índices em transação
    await db.$transaction(
      orderedIds.map((id, idx) =>
        db.column.update({ where: { id }, data: { index: idx } })
      )
    );

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}

/** Reordenar/mover cards (entre/na mesma coluna) */
export async function reorderCards(
  boardId: string,
  updates: Array<{ id: string; columnId: string; index: number }>
) {
  return withRbacGuard(async () => {
    // Busca o board e verifica se o usuário tem acesso
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });
    if (!board) {
      throw new Error("Board não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(board.organizationId);

    // valida: todos os cards existem e pertencem ao board
    const cardIds = updates.map((u) => u.id);
    const cards = await db.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, column: { select: { boardId: true } } },
    });
    if (
      cards.length !== updates.length ||
      cards.some((c) => c.column.boardId !== boardId)
    ) {
      throw new Error("Cards inválidos para este board.");
    }

    // aplica novos (columnId, index)
    await db.$transaction(
      updates.map((u) =>
        db.card.update({
          where: { id: u.id },
          data: { columnId: u.columnId, index: u.index },
        })
      )
    );

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}
