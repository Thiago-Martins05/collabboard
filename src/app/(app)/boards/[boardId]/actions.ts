"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

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
  });
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

  return withRbacGuard(async () => {
    // Busca a coluna e verifica se o usuário tem acesso
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: { board: { select: { organizationId: true } } },
    });
    if (!column || column.boardId !== boardId) {
      throw new Error("Coluna não encontrada.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(column.board.organizationId);

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
  });
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

  return withRbacGuard(async () => {
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: { board: { select: { organizationId: true } } },
    });
    if (!column || column.boardId !== boardId) {
      throw new Error("Coluna não encontrada.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(column.board.organizationId);

    await db.column.update({
      where: { id: columnId },
      data: { title: title.trim() },
    });

    return { ok: true };
  });
}

const deleteColumnSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
});

export async function deleteColumn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
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

  return withRbacGuard(async () => {
    const column = await db.column.findUnique({
      where: { id: columnId },
      include: { board: { select: { organizationId: true } } },
    });
    if (!column || column.boardId !== boardId) {
      throw new Error("Coluna não encontrada.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(column.board.organizationId);

    await db.column.delete({ where: { id: columnId } });

    return { ok: true };
  });
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

  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { select: { organizationId: true } } } },
      },
    });
    if (!card || card.column.boardId !== boardId) {
      throw new Error("Card não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    const data: { title?: string; description?: string | null } = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined)
      data.description = (description ?? "").trim() || null;

    await db.card.update({ where: { id: cardId }, data });
    return { ok: true }; // sem revalidatePath — o client fará router.refresh()
  });
}

const deleteCardSchema = z.object({
  boardId: z.string().min(1),
  cardId: z.string().min(1),
});

export async function deleteCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
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

  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { select: { organizationId: true } } } },
      },
    });
    if (!card || card.column.boardId !== boardId) {
      throw new Error("Card não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    await db.card.delete({ where: { id: cardId } });
    return { ok: true }; // sem revalidatePath — o client fará router.refresh()
  });
}
