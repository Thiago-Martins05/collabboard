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
import { enforceFeatureLimit } from "@/lib/limits";
import { Role } from "@prisma/client";
import { randomUUID } from "crypto";

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

const inviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "MEMBER"]),
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
        },
      },
    });

    if (!user?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada");
    }

    const org = user.memberships[0].organization;

    // Lista todos os membros da organização
    const memberships = await db.membership.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    });

    return memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name || "Sem nome",
      email: membership.user.email,
      role: membership.role,
      membershipId: membership.id,
    }));
  });
}

/**
 * Altera o role de um membro (apenas OWNER/ADMIN)
 */
export async function changeRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  return withRbacGuard(async () => {
    const { userId, role } = parsed.data;

    // Busca o membro e verifica se existe
    const membership = await db.membership.findFirst({
      where: { userId },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new Error("Membro não encontrado");
    }

    // Verifica se o usuário atual tem permissão (OWNER/ADMIN)
    await assertOwnerOrAdmin(membership.organizationId);

    // Não permite alterar o role do OWNER
    if (membership.role === "OWNER") {
      throw new Error("Não é possível alterar o role do proprietário");
    }

    // Atualiza o role
    await db.membership.update({
      where: { id: membership.id },
      data: { role },
    });

    revalidatePath("/settings/members");
    return { ok: true };
  });
}

/**
 * Remove um membro da organização (apenas OWNER/ADMIN)
 */
export async function removeMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = removeMemberSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  return withRbacGuard(async () => {
    const { userId } = parsed.data;

    // Busca o membro e verifica se existe
    const membership = await db.membership.findFirst({
      where: { userId },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new Error("Membro não encontrado");
    }

    // Verifica se o usuário atual tem permissão (OWNER/ADMIN)
    await assertOwnerOrAdmin(membership.organizationId);

    // Não permite remover o OWNER
    if (membership.role === "OWNER") {
      throw new Error("Não é possível remover o proprietário da organização");
    }

    // Remove o membro
    await db.membership.delete({
      where: { id: membership.id },
    });

    revalidatePath("/settings/members");
    return { ok: true };
  });
}

/**
 * Convida um usuário por e-mail para a organização
 */
export async function inviteMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  return withRbacGuard(async () => {
    const { email, role } = parsed.data;

    // Busca a organização do usuário atual
    const session = await getSession();
    if (!session?.user?.email) {
      throw new Error("Não autenticado");
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user?.memberships?.[0]?.organization) {
      throw new Error("Organização não encontrada");
    }

    const org = user.memberships[0].organization;

    // Verifica se o usuário atual tem permissão (OWNER/ADMIN)
    await assertOwnerOrAdmin(org.id);

    // Verifica se não excedeu o limite de membros
    const canInvite = await enforceFeatureLimit(org.id, "members");
    if (!canInvite) {
      return { ok: false, error: "Limite de membros atingido no plano Free." };
    }

    // Verifica se o e-mail já é membro
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { organizationId: org.id },
        },
      },
    });

    if (existingUser?.memberships?.length) {
      throw new Error("Este e-mail já é membro da organização");
    }

    // Verifica se já existe um convite pendente
    const existingInvite = await db.invite.findFirst({
      where: {
        email,
        organizationId: org.id,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new Error("Já existe um convite pendente para este e-mail");
    }

    // Cria o convite
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    const invite = await db.invite.create({
      data: {
        token,
        email,
        role,
        organizationId: org.id,
        invitedById: user.id,
        expiresAt,
      },
    });

    // Mock do envio de e-mail (apenas log)
    console.log(`[INVITE] Convite enviado para ${email}:`);
    console.log(`[INVITE] Token: ${token}`);
    console.log(`[INVITE] Link: http://localhost:3000/invites/${token}`);
    console.log(`[INVITE] Organização: ${org.name}`);
    console.log(`[INVITE] Role: ${role}`);
    console.log(`[INVITE] Expira em: ${expiresAt.toISOString()}`);

    revalidatePath("/settings/members");
    return { ok: true };
  });
}
