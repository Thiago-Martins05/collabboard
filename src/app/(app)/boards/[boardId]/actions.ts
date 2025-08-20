"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
import { publishEvent } from "@/lib/realtime";
import { enforceFeatureLimit } from "@/lib/limits";

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

const updateCardSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(2, "Informe um título (mín. 2 caracteres).").max(120),
  description: z.string().max(2000).optional().nullable(),
});

const deleteCardModalSchema = z.object({
  cardId: z.string().min(1),
});

const toggleLabelSchema = z.object({
  cardId: z.string().min(1),
  labelId: z.string().min(1),
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

    // Verifica se não excedeu o limite de colunas
    const canCreate = await enforceFeatureLimit(
      board.organizationId,
      "columns"
    );
    if (!canCreate) {
      return { ok: false, error: "Limite de colunas atingido no plano Free." };
    }

    const count = await db.column.count({ where: { boardId } });

    const column = await db.column.create({
      data: {
        boardId,
        title: title.trim(),
        index: count, // próximo slot
      },
    });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "column.created",
      column: {
        id: column.id,
        title: column.title,
        index: column.index,
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

    // Verifica se não excedeu o limite de cards
    const canCreate = await enforceFeatureLimit(
      column.board.organizationId,
      "cards"
    );
    if (!canCreate) {
      return { ok: false, error: "Limite de cards atingido no plano Free." };
    }

    const count = await db.card.count({ where: { columnId } });

    const card = await db.card.create({
      data: {
        columnId,
        title: title.trim(),
        description: (description ?? "").trim() || null,
        index: count,
      },
    });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "card.created",
      card: {
        id: card.id,
        title: card.title,
        description: card.description,
        columnId: card.columnId,
        index: card.index,
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

    const updatedColumn = await db.column.update({
      where: { id: columnId },
      data: { title: title.trim() },
    });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "column.updated",
      column: {
        id: updatedColumn.id,
        title: updatedColumn.title,
      },
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

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "column.deleted",
      columnId,
    });

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

    const updatedCard = await db.card.update({ where: { id: cardId }, data });

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "card.updated",
      card: {
        id: updatedCard.id,
        title: updatedCard.title,
        description: updatedCard.description,
      },
    });

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

    // Publica evento em tempo real
    await publishEvent(boardId, {
      type: "card.deleted",
      cardId,
    });

    return { ok: true }; // sem revalidatePath — o client fará router.refresh()
  });
}

/**
 * Atualiza um card (título e descrição)
 * Usado pelo modal de detalhes do card
 */
export async function updateCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateCardSchema.safeParse({
    cardId: (formData.get("cardId") as string) ?? "",
    title: (formData.get("title") as string) ?? "",
    description: formData.get("description") as string | null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { cardId, title, description } = parsed.data;

  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { select: { organizationId: true } } } },
      },
    });

    if (!card) {
      throw new Error("Card não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    const updatedCard = await db.card.update({
      where: { id: cardId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    // Publica evento em tempo real
    await publishEvent(card.column.boardId, {
      type: "card.updated",
      card: {
        id: updatedCard.id,
        title: updatedCard.title,
        description: updatedCard.description,
      },
    });

    revalidatePath(`/boards/${card.column.boardId}`);
    return { ok: true };
  });
}

/**
 * Adiciona ou remove uma label de um card
 */
export async function toggleLabel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = toggleLabelSchema.safeParse({
    cardId: (formData.get("cardId") as string) ?? "",
    labelId: (formData.get("labelId") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { cardId, labelId } = parsed.data;

  return withRbacGuard(async () => {
    // Busca o card e verifica se o usuário tem acesso
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { select: { organizationId: true } } } },
      },
    });

    if (!card) {
      throw new Error("Card não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    // Verifica se a label existe e pertence ao board
    const label = await db.label.findFirst({
      where: {
        id: labelId,
        boardId: card.column.boardId,
      },
    });

    if (!label) {
      throw new Error("Label não encontrada.");
    }

    // Verifica se a label já está associada ao card
    const existingCardLabel = await db.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    if (existingCardLabel) {
      // Remove a label
      await db.cardLabel.delete({
        where: {
          cardId_labelId: {
            cardId,
            labelId,
          },
        },
      });
    } else {
      // Adiciona a label
      await db.cardLabel.create({
        data: {
          cardId,
          labelId,
        },
      });
    }

    // Publica evento em tempo real
    await publishEvent(card.column.boardId, {
      type: "label.toggled",
      cardId,
      labelId,
      added: !existingCardLabel,
    });

    revalidatePath(`/boards/${card.column.boardId}`);
    return { ok: true };
  });
}

/**
 * Deleta um card (versão simplificada para o modal)
 * Usado pelo modal de detalhes do card
 */
export async function deleteCardModal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = deleteCardModalSchema.safeParse({
    cardId: (formData.get("cardId") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { cardId } = parsed.data;

  return withRbacGuard(async () => {
    const card = await db.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: { select: { organizationId: true } } } },
      },
    });

    if (!card) {
      throw new Error("Card não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(card.column.board.organizationId);

    await db.card.delete({ where: { id: cardId } });

    // Publica evento em tempo real
    await publishEvent(card.column.boardId, {
      type: "card.deleted",
      cardId,
    });

    revalidatePath(`/boards/${card.column.boardId}`);
    return { ok: true };
  });
}
