"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
import { publishEvent } from "@/lib/realtime";

const reorderSchema = z.object({
  boardId: z.string().min(1),
  /**
   * Lista final de posições para atualizar em lote.
   * Cada item representa um card em sua posição final.
   */
  updates: z
    .array(
      z.object({
        id: z.string().min(1), // cardId
        columnId: z.string().min(1), // coluna final
        index: z.number().int().min(0), // posição final na coluna
      })
    )
    .min(1),
});

export type ReorderState = { ok: boolean; error?: string };

export async function reorderCards(
  _: ReorderState,
  formData: FormData
): Promise<ReorderState> {
  const parsed = reorderSchema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
    updates: JSON.parse((formData.get("updates") as string) ?? "[]"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { boardId, updates } = parsed.data;

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

    // Segurança: garanta que todos os cards realmente pertencem ao board
    const cardIds = updates.map((u) => u.id);
    const found = await db.card.findMany({
      where: { id: { in: cardIds } },
      select: {
        id: true,
        column: {
          select: {
            boardId: true,
          },
        },
      },
    });

    const validIds = new Set(
      found.filter((c) => c.column.boardId === boardId).map((c) => c.id)
    );
    if (validIds.size !== cardIds.length) {
      throw new Error("Tentativa de mover cards fora do seu board.");
    }

    // Aplica as mudanças em transação
    await db.$transaction(async (tx) => {
      for (const u of updates) {
        await tx.card.update({
          where: { id: u.id },
          data: { columnId: u.columnId, index: u.index },
        });
      }
    });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "card.reordered",
      updates,
    });

    return { ok: true };
  });
}
