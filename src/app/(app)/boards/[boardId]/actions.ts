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

const renameColumnSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(2, "Informe um título (mín. 2).").max(80),
});

export async function renameColumn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = renameColumnSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      columnId: (formData.get("columnId") as string) ?? "",
      title: (formData.get("title") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, columnId, title } = parsed.data;

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

    await db.column.update({
      where: { id: columnId },
      data: { title: title.trim() },
    });

    return { ok: true };
  } catch (e) {
    console.error("renameColumn error:", e);
    return { ok: false, error: "Falha ao renomear a coluna." };
  }
}

const deleteColumnSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
});

export async function deleteColumn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = deleteColumnSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      columnId: (formData.get("columnId") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, columnId } = parsed.data;

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

    await db.column.delete({ where: { id: columnId } });

    return { ok: true };
  } catch (e) {
    console.error("deleteColumn error:", e);
    return { ok: false, error: "Falha ao excluir a coluna." };
  }
}

// --- B3.5: card rename & delete ---

const renameCardSchema = z
  .object({
    boardId: z.string().min(1),
    cardId: z.string().min(1),
    title: z.string().min(2, "Título muito curto.").max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => d.title !== undefined || d.description !== undefined, {
    message: "Forneça título ou descrição para atualizar.",
  });

export async function renameCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = renameCardSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      cardId: (formData.get("cardId") as string) ?? "",
      title: formData.get("title")?.toString(),
      description: formData.get("description")?.toString(),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, cardId, title, description } = parsed.data;

    const card = await db.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });
    if (
      !card ||
      card.column.boardId !== boardId ||
      card.column.board.organizationId !== org.id
    ) {
      return { ok: false, error: "Card não encontrado." };
    }

    const data: { title?: string; description?: string | null } = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined)
      data.description = (description ?? "").trim() || null;

    await db.card.update({ where: { id: cardId }, data });
    return { ok: true }; // sem revalidatePath — o client fará router.refresh()
  } catch (e) {
    console.error("renameCard error:", e);
    return { ok: false, error: "Falha ao atualizar o card." };
  }
}

const deleteCardSchema = z.object({
  boardId: z.string().min(1),
  cardId: z.string().min(1),
});

export async function deleteCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = deleteCardSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
      cardId: (formData.get("cardId") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }
    const { boardId, cardId } = parsed.data;

    const card = await db.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });
    if (
      !card ||
      card.column.boardId !== boardId ||
      card.column.board.organizationId !== org.id
    ) {
      return { ok: false, error: "Card não encontrado." };
    }

    await db.card.delete({ where: { id: cardId } });
    return { ok: true }; // sem revalidatePath — o client fará router.refresh()
  } catch (e) {
    console.error("deleteCard error:", e);
    return { ok: false, error: "Falha ao excluir o card." };
  }
}
