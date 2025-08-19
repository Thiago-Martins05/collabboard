"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

const declineInviteSchema = z.object({
  token: z.string().min(1),
});

export type ActionState = { ok: boolean; error?: string };

/**
 * Aceita um convite e cria o membership
 */
export async function acceptInvite(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Token inválido",
    };
  }

  try {
    const { token } = parsed.data;

    // Busca o convite
    const invite = await db.invite.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invite) {
      return {
        ok: false,
        error: "Convite não encontrado",
      };
    }

    if (invite.expiresAt < new Date()) {
      return {
        ok: false,
        error: "Convite expirado",
      };
    }

    // Verifica se o usuário está autenticado
    const session = await getSession();
    if (!session?.user?.email) {
      return {
        ok: false,
        error: "Você precisa estar autenticado para aceitar o convite",
      };
    }

    // Verifica se o e-mail do convite corresponde ao usuário autenticado
    if (session.user.email !== invite.email) {
      return {
        ok: false,
        error: "Este convite não é para você",
      };
    }

    // Busca o usuário
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        ok: false,
        error: "Usuário não encontrado",
      };
    }

    // Verifica se já é membro
    const existingMembership = await db.membership.findFirst({
      where: {
        userId: user.id,
        organizationId: invite.organizationId,
      },
    });

    if (existingMembership) {
      return {
        ok: false,
        error: "Você já é membro desta organização",
      };
    }

    // Cria o membership

    // Cria o membership
    await db.membership.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });

    // Remove o convite
    await db.invite.delete({
      where: { id: invite.id },
    });

    return { ok: true };
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return {
      ok: false,
      error: "Erro interno ao aceitar convite",
    };
  }
}

/**
 * Recusa um convite
 */
export async function declineInvite(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = declineInviteSchema.safeParse({
    token: formData.get("token"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Token inválido",
    };
  }

  try {
    const { token } = parsed.data;

    // Busca o convite
    const invite = await db.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      return {
        ok: false,
        error: "Convite não encontrado",
      };
    }

    if (invite.expiresAt < new Date()) {
      return {
        ok: false,
        error: "Convite expirado",
      };
    }

    // Remove o convite
    await db.invite.delete({
      where: { id: invite.id },
    });

    return { ok: true };
  } catch (error) {
    console.error("Erro ao recusar convite:", error);
    return {
      ok: false,
      error: "Erro interno ao recusar convite",
    };
  }
}
