"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  withRbacGuard,
  requireSession,
  assertOwnerOrAdmin,
} from "@/lib/rbac-guard";
import { Role } from "@prisma/client";

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

export type ActionState = { ok: boolean; error?: string };

/**
 * Lista todos os membros da organização do usuário atual
 */
export async function listMembers() {
  return withRbacGuard(async () => {
    const session = await getSession();
    if (!session?.user?.email) {
      throw new Error("Não autenticado");
    }

    // Busca o usuário atual e sua organização
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada.");
    }

    const orgId = user.memberships[0].organization.id;

    // Lista todos os membros da organização
    const members = await db.membership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER primeiro, depois ADMIN, depois MEMBER
        { user: { name: "asc" } },
      ],
    });

    return members.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name || "Sem nome",
      email: membership.user.email || "",
      role: membership.role,
      membershipId: membership.id,
    }));
  });
}

/**
 * Altera o role de um membro
 * Requer: ser OWNER ou ADMIN
 */
export async function changeRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = changeRoleSchema.safeParse({
    userId: (formData.get("userId") as string) ?? "",
    role: (formData.get("role") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { userId, role } = parsed.data;

  return withRbacGuard(async () => {
    const session = await getSession();
    if (!session?.user?.email) {
      throw new Error("Não autenticado");
    }

    // Busca o usuário atual e sua organização
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!currentUser?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada.");
    }

    const orgId = currentUser.memberships[0].organization.id;
    const currentUserRole = currentUser.memberships[0].role;

    // Verifica se o usuário atual é OWNER ou ADMIN
    await assertOwnerOrAdmin(orgId);

    // Busca o membro a ser alterado
    const targetMembership = await db.membership.findFirst({
      where: {
        userId,
        organizationId: orgId,
      },
    });

    if (!targetMembership) {
      throw new Error("Membro não encontrado.");
    }

    // Regras de negócio:
    // 1. OWNER não pode alterar seu próprio role
    // 2. Apenas OWNER pode criar outro OWNER
    // 3. ADMIN não pode alterar role de OWNER
    if (currentUser.id === userId && currentUserRole === "OWNER") {
      throw new Error("OWNER não pode alterar seu próprio role.");
    }

    if (role === "OWNER" && currentUserRole !== "OWNER") {
      throw new Error("Apenas OWNER pode promover outro usuário a OWNER.");
    }

    if (targetMembership.role === "OWNER" && currentUserRole !== "OWNER") {
      throw new Error("Apenas OWNER pode alterar role de outro OWNER.");
    }

    // Atualiza o role
    await db.membership.update({
      where: { id: targetMembership.id },
      data: { role: role as Role },
    });

    revalidatePath("/settings/members");
    return { ok: true };
  });
}

/**
 * Remove um membro da organização
 * Requer: ser OWNER ou ADMIN
 */
export async function removeMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = removeMemberSchema.safeParse({
    userId: (formData.get("userId") as string) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { userId } = parsed.data;

  return withRbacGuard(async () => {
    const session = await getSession();
    if (!session?.user?.email) {
      throw new Error("Não autenticado");
    }

    // Busca o usuário atual e sua organização
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!currentUser?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada.");
    }

    const orgId = currentUser.memberships[0].organization.id;
    const currentUserRole = currentUser.memberships[0].role;

    // Verifica se o usuário atual é OWNER ou ADMIN
    await assertOwnerOrAdmin(orgId);

    // Não pode remover a si mesmo
    if (currentUser.id === userId) {
      throw new Error("Você não pode remover a si mesmo.");
    }

    // Busca o membro a ser removido
    const targetMembership = await db.membership.findFirst({
      where: {
        userId,
        organizationId: orgId,
      },
    });

    if (!targetMembership) {
      throw new Error("Membro não encontrado.");
    }

    // ADMIN não pode remover OWNER
    if (targetMembership.role === "OWNER" && currentUserRole !== "OWNER") {
      throw new Error("Apenas OWNER pode remover outro OWNER.");
    }

    // Remove o membro
    await db.membership.delete({
      where: { id: targetMembership.id },
    });

    revalidatePath("/settings/members");
    return { ok: true };
  });
}
