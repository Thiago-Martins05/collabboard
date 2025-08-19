"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { getSession } from "@/lib/session";
import { z } from "zod";

/* ============ CREATE ============ */

const createBoardSchema = z.object({
  title: z.string().min(2, "Informe um título (mín. 2 caracteres).").max(80),
});

export type CreateBoardState = { ok: boolean; error?: string };

export async function createBoard(
  _prev: CreateBoardState,
  formData: FormData
): Promise<CreateBoardState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = createBoardSchema.safeParse({
      title: (formData.get("title") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    await db.board.create({
      data: {
        title: parsed.data.title.trim(),
        organizationId: org.id,
      },
    });

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("createBoard error:", e);
    return { ok: false, error: "Falha ao criar o board." };
  }
}

/* ============ DELETE ============ */

const deleteBoardSchema = z.object({
  boardId: z.string().min(1, "ID inválido."),
});

export type DeleteBoardState = { ok: boolean; error?: string };

export async function deleteBoard(
  _prev: DeleteBoardState,
  formData: FormData
): Promise<DeleteBoardState> {
  try {
    const session = await getSession();
    if (!session?.user?.email)
      return { ok: false, error: "Você precisa estar autenticado." };

    const org = await ensureUserPrimaryOrganization();
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const parsed = deleteBoardSchema.safeParse({
      boardId: (formData.get("boardId") as string) ?? "",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    // (opcional) conferir se o board pertence à mesma org
    const board = await db.board.findUnique({
      where: { id: parsed.data.boardId },
    });
    if (!board || board.organizationId !== org.id) {
      return { ok: false, error: "Board não encontrado." };
    }

    await db.board.delete({ where: { id: parsed.data.boardId } });

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("deleteBoard error:", e);
    return { ok: false, error: "Falha ao excluir o board." };
  }
}
