"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";
import { getSession } from "@/lib/session";
import { enforceFeatureLimit } from "@/lib/limits";
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
  console.log("🔍 DEBUG - createBoard called");

  const parsed = createBoardSchema.safeParse({
    title: (formData.get("title") as string) ?? "",
  });
  if (!parsed.success) {
    console.log(
      "❌ DEBUG - Validation failed:",
      parsed.error.issues[0]?.message
    );
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  console.log("✅ DEBUG - Validation passed, executing action");

  try {
    // Busca a organização primária do usuário atual
    const session = await getSession();
    if (!session?.user?.email) {
      return { ok: false, error: "Não autenticado" };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: { include: { organization: true } } },
    });

    if (!user?.memberships?.[0]?.organization) {
      return { ok: false, error: "Organização não encontrada." };
    }

    const org = user.memberships[0].organization;

    // Verifica se o usuário é membro da organização
    try {
      await requireMembership(org.id);
    } catch (error) {
      return {
        ok: false,
        error: "Sem permissão: não é membro desta organização",
      };
    }

    // Verifica se não excedeu o limite de boards
    const limitCheck = await enforceFeatureLimit(org.id, "boards");
    console.log("🔍 DEBUG - Limit check result:", limitCheck);
    if (!limitCheck.allowed) {
      console.log("❌ DEBUG - Limit exceeded, returning error");
      return { ok: false, error: limitCheck.error };
    }
    console.log("✅ DEBUG - Limit check passed, creating board");

    console.log("✅ DEBUG - Creating board in database");
    await db.board.create({
      data: {
        title: parsed.data.title.trim(),
        organizationId: org.id,
      },
    });

    console.log("✅ DEBUG - Board created successfully, returning ok: true");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.log("❌ DEBUG - Unexpected error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro interno",
    };
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
