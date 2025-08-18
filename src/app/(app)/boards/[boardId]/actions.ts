"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createColumnSchema, createCardSchema } from "./schema";

export async function createColumn(
  prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

    const boardId = String(formData.get("boardId") || "");
    const raw = { title: String(formData.get("title") || "") };
    const parsed = createColumnSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Inválido",
      };

    // checa existência do board
    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { id: true },
    });
    if (!board) return { ok: false, error: "Board não encontrado." };

    const last = await db.column.findFirst({
      where: { boardId },
      orderBy: { index: "desc" },
      select: { index: true },
    });
    const nextIndex = (last?.index ?? -1) + 1;

    await db.column.create({
      data: {
        boardId,
        title: parsed.data.title,
        index: nextIndex,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  } catch (e) {
    console.error("createColumn:", e);
    return { ok: false, error: "Erro ao criar coluna." };
  }
}

export async function createCard(
  prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

    const boardId = String(formData.get("boardId") || "");
    const raw = {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      columnId: String(formData.get("columnId") || ""),
    };
    const parsed = createCardSchema.safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Inválido",
      };

    // checa existência da coluna
    const column = await db.column.findUnique({
      where: { id: parsed.data.columnId },
      select: { id: true, boardId: true },
    });
    if (!column || column.boardId !== boardId)
      return { ok: false, error: "Coluna inválida." };

    const last = await db.card.findFirst({
      where: { columnId: column.id },
      orderBy: { index: "desc" },
      select: { index: true },
    });
    const nextIndex = (last?.index ?? -1) + 1;

    await db.card.create({
      data: {
        columnId: column.id,
        title: parsed.data.title,
        description: parsed.data.description,
        index: nextIndex,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { ok: true };
  } catch (e) {
    console.error("createCard:", e);
    return { ok: false, error: "Erro ao criar card." };
  }
}
