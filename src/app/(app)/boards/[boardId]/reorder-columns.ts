"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";

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
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };
    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

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

    // segurança: garanta que todas as colunas pertencem ao board & org
    const cols = await db.column.findMany({
      where: { id: { in: columnIds } },
      select: {
        id: true,
        boardId: true,
        board: { select: { organizationId: true } },
      },
    });
    if (cols.length !== columnIds.length)
      return { ok: false, error: "Colunas inválidas." };
    if (
      cols.some(
        (c) => c.boardId !== boardId || c.board.organizationId !== org.id
      )
    ) {
      return {
        ok: false,
        error: "Tentativa de mover colunas fora do seu board.",
      };
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

    return { ok: true };
  } catch (e) {
    console.error("reorderColumns error:", e);
    return { ok: false, error: "Falha ao reordenar colunas." };
  }
}
