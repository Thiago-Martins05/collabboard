"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { createBoardSchema } from "./schema";
import { getUserPrimaryOrganization } from "@/lib/tenant";

export async function createBoard(
  prevState: { ok?: boolean; error?: string } | undefined,
  formData: FormData
) {
  try {
    // 1) sessão
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { ok: false, error: "Não autenticado." };
    }

    // 2) validação
    const raw = { title: String(formData.get("title") || "") };
    const parsed = createBoardSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return { ok: false, error: msg };
    }

    // 3) org ativa do usuário
    const org = await getUserPrimaryOrganization(session.user.id as string);
    if (!org?.id) {
      return { ok: false, error: "Organização não encontrada." };
    }

    // 4) criar no banco
    await db.board.create({
      data: {
        organizationId: org.id,
        title: parsed.data.title,
        columns: {
          create: [
            { title: "A fazer", index: 0 },
            { title: "Em andamento", index: 1 },
            { title: "Concluído", index: 2 },
          ],
        },
      },
    });

    // 5) revalidar a listagem do dashboard
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("createBoard error:", e);
    return { ok: false, error: "Erro ao criar board." };
  }
}

export async function deleteBoard(_: any, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { ok: false, error: "Não autenticado." };

    const boardId = String(formData.get("boardId") || "");
    if (!boardId) return { ok: false, error: "ID do board inválido." };

    const org = await getUserPrimaryOrganization(session.user.id as string);
    if (!org?.id) return { ok: false, error: "Organização não encontrada." };

    const board = await db.board.findUnique({
      where: { id: boardId },
      select: { id: true, organizationId: true },
    });
    if (!board || board.organizationId !== org.id) {
      return { ok: false, error: "Board não encontrado para este usuário." };
    }

    await db.$transaction(async (tx) => {
      const cols = await tx.column.findMany({
        where: { boardId },
        select: { id: true },
      });
      const colIds = cols.map((c) => c.id);

      if (colIds.length) {
        await tx.card.deleteMany({ where: { columnId: { in: colIds } } });
      }
      await tx.column.deleteMany({ where: { boardId } });
      await tx.board.delete({ where: { id: boardId } });
    });

    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("deleteBoard:", e);
    return { ok: false, error: "Erro ao deletar board." };
  }
}
