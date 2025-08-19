"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { getSession } from "@/lib/session";

/** Helpers de validação */
const createColumnSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(2, "Informe um título (mín. 2 caracteres).").max(80),
});

const createCardSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(2, "Informe um título (mín. 2 caracteres).").max(120),
  description: z.string().max(2000).optional().nullable(),
});

export type ActionState = { ok: boolean; error?: string };

/**
 * Cria uma nova coluna no board.
 * Requer: board pertença à org do usuário.
 * Index é definido como (count atual).
 */
export async function createColumn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = createColumnSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      title: (formData.get("title") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, title } = parsed.data;

    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board || board.organizationId !== org.id) {
      return { ok: false, error: "Board não encontrado." };
    }

    const count = await db.column.count({ where: { boardId } });

    await db.column.create({
      data: {
        boardId,
        title: title.trim(),
        index: count, // próximo slot
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  } catch (e) {
    console.error("createColumn error:", e);
    return { ok: false, error: "Falha ao criar a coluna." };
  }
}

/**
 * Cria um novo card em uma coluna.
 * Requer: coluna pertença ao board e board pertença à org do usuário.
 * Index é definido como (count atual).
 */
export async function createCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = createCardSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      columnId: (formData.get("columnId") as string) ?? "",
      title: (formData.get("title") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, columnId, title, description } = parsed.data;

    const column = await db.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (
      !column ||
      column.boardId !== boardId ||
      column.board.organizationId !== org.id
    ) {
      return { ok: false, error: "Coluna não encontrada." };
    }

    const count = await db.card.count({ where: { columnId } });

    await db.card.create({
      data: {
        columnId,
        title: title.trim(),
        description: (description ?? "").trim() || null,
        index: count,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  } catch (e) {
    console.error("createCard error:", e);
    return { ok: false, error: "Falha ao criar o card." };
  }
}
