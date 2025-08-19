"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";

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
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

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

    // Segurança: garanta que todos os cards realmente pertencem ao board & org do usuário
    const cardIds = updates.map((u) => u.id);
    const found = await db.card.findMany({
      where: { id: { in: cardIds } },
      select: {
        id: true,
        column: {
          select: {
            boardId: true,
            board: { select: { organizationId: true } },
          },
        },
      },
    });

    const validIds = new Set(
      found
        .filter(
          (c) =>
            c.column.boardId === boardId &&
            c.column.board.organizationId === org.id
        )
        .map((c) => c.id)
    );
    if (validIds.size !== cardIds.length) {
      return {
        ok: false,
        error: "Tentativa de mover cards fora do seu board.",
      };
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

    return { ok: true };
  } catch (e) {
    console.error("reorderCards error:", e);
    return { ok: false, error: "Falha ao reordenar os cards." };
  }
}
