"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
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
  const parsed = createBoardSchema.safeParse({
    title: (formData.get("title") as string) ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  return withRbacGuard(async () => {
    // Busca a organização primária do usuário
    const user = await db.user.findFirst({
      where: { memberships: { some: {} } },
      include: { memberships: { include: { organization: true } } },
      orderBy: { memberships: { createdAt: "asc" } },
    });

    if (!user?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada.");
    }

    const org = user.memberships[0].organization;

    // Verifica se o usuário é membro da organização
    await requireMembership(org.id);

    await db.board.create({
      data: {
        title: parsed.data.title.trim(),
        organizationId: org.id,
      },
    });

    revalidatePath("/dashboard");
    return { ok: true };
  });
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
  const parsed = deleteBoardSchema.safeParse({
    boardId: (formData.get("boardId") as string) ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  return withRbacGuard(async () => {
    // Busca o board e verifica se o usuário tem acesso
    const board = await db.board.findUnique({
      where: { id: parsed.data.boardId },
      select: { organizationId: true },
    });
    if (!board) {
      throw new Error("Board não encontrado.");
    }

    // Verifica se o usuário é membro da organização
    await requireMembership(board.organizationId);

    await db.board.delete({ where: { id: parsed.data.boardId } });

    revalidatePath("/dashboard");
    return { ok: true };
  });
}
