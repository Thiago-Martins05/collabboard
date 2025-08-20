"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
import { publishEvent } from "@/lib/realtime";

const schema = z.object({
  boardId: z.string().min(1),
  // ordem final das colunas (da esquerda p/ direita)
  columnIds: z.array(z.string().min(1)).min(1),
});

export type ReorderColsState = { ok: boolean; error?: string };

export async function reorderColumns(
  _: ReorderColsState,
  formData: FormData
): Promise<ReorderColsState> {
  const parsed = schema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
    columnIds: JSON.parse((formData.get("columnIds") as string) ?? "[]"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { boardId, columnIds } = parsed.data;

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

    // segurança: garanta que todas as colunas pertencem ao board
    const cols = await db.column.findMany({
      where: { id: { in: columnIds } },
      select: {
        id: true,
        boardId: true,
      },
    });
    if (cols.length !== columnIds.length) {
      throw new Error("Colunas inválidas.");
    }
    if (cols.some((c) => c.boardId !== boardId)) {
      throw new Error("Tentativa de mover colunas fora do seu board.");
    }

    // aplica novos índices em transação
    await db.$transaction(async (tx) => {
      for (let i = 0; i < columnIds.length; i++) {
        await tx.column.update({
          where: { id: columnIds[i] },
          data: { index: i },
        });
      }
    });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "column.reordered",
      columnIds,
    });

    return { ok: true };
  });
}
