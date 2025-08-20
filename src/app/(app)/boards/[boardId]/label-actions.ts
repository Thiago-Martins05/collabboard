"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

const createLabelSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().min(1, "Nome é obrigatório").max(50, "Máximo 50 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hex válido"),
});

const updateLabelSchema = z.object({
  boardId: z.string().min(1),
  labelId: z.string().min(1),
  name: z.string().min(1, "Nome é obrigatório").max(50, "Máximo 50 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hex válido"),
});

const deleteLabelSchema = z.object({
  boardId: z.string().min(1),
  labelId: z.string().min(1),
});

export type ActionState = { ok: boolean; error?: string };

/**
 * Cria uma nova label no board
 */
export async function createLabel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createLabelSchema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
    name: (formData.get("name") as string) ?? "",
    color: (formData.get("color") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { boardId, name, color } = parsed.data;

  return withRbacGuard(async () => {
    // Verifica se o usuário é membro da organização
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });

    if (!board) {
      throw new Error("Board não encontrado.");
    }

    await requireMembership(board.organizationId);

    // Verifica se já existe uma label com o mesmo nome no board
    const existingLabel = await db.label.findFirst({
      where: {
        boardId,
        name: name.trim(),
      },
    });

    if (existingLabel) {
      throw new Error("Já existe uma label com este nome.");
    }

    await db.label.create({
      data: {
        boardId,
        name: name.trim(),
        color,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}

/**
 * Atualiza uma label existente
 */
export async function updateLabel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateLabelSchema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
    labelId: (formData.get("labelId") as string) ?? "",
    name: (formData.get("name") as string) ?? "",
    color: (formData.get("color") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { boardId, labelId, name, color } = parsed.data;

  return withRbacGuard(async () => {
    // Verifica se o usuário é membro da organização
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });

    if (!board) {
      throw new Error("Board não encontrado.");
    }

    await requireMembership(board.organizationId);

    // Verifica se a label existe e pertence ao board
    const existingLabel = await db.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!existingLabel) {
      throw new Error("Label não encontrada.");
    }

    // Verifica se já existe outra label com o mesmo nome no board
    const duplicateLabel = await db.label.findFirst({
      where: {
        boardId,
        name: name.trim(),
        id: { not: labelId },
      },
    });

    if (duplicateLabel) {
      throw new Error("Já existe uma label com este nome.");
    }

    await db.label.update({
      where: { id: labelId },
      data: {
        name: name.trim(),
        color,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}

/**
 * Deleta uma label
 */
export async function deleteLabel(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = deleteLabelSchema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
    labelId: (formData.get("labelId") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { boardId, labelId } = parsed.data;

  return withRbacGuard(async () => {
    // Verifica se o usuário é membro da organização
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true },
    });

    if (!board) {
      throw new Error("Board não encontrado.");
    }

    await requireMembership(board.organizationId);

    // Verifica se a label existe e pertence ao board
    const existingLabel = await db.label.findFirst({
      where: {
        id: labelId,
        boardId,
      },
    });

    if (!existingLabel) {
      throw new Error("Label não encontrada.");
    }

    // Deleta a label (as relações CardLabel serão deletadas automaticamente por cascade)
    await db.label.delete({
      where: { id: labelId },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  });
}
