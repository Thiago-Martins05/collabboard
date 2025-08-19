"use server";

import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

/**
 * Requer que o usuário esteja autenticado
 * Retorna o userId ou lança erro
 */
export async function requireSession(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.email) {
    throw new Error("Não autenticado");
  }

  // Busca o usuário no banco para obter o ID
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  return user.id;
}

/**
 * Requer que o usuário seja membro da organização
 * Lança erro se não for membro
 */
export async function requireMembership(orgId: string): Promise<void> {
  const userId = await requireSession();

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: orgId,
      },
    },
  });

  if (!membership) {
    throw new Error("Sem permissão: não é membro desta organização");
  }
}

/**
 * Requer que o usuário tenha um dos roles especificados na organização
 * Lança erro se não tiver permissão
 */
export async function requireRole(orgId: string, roles: Role[]): Promise<void> {
  const userId = await requireSession();

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: orgId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new Error("Sem permissão: não é membro desta organização");
  }

  if (!roles.includes(membership.role)) {
    throw new Error(`Sem permissão: role ${membership.role} não é suficiente`);
  }
}

/**
 * Atalho para verificar se o usuário é OWNER ou ADMIN
 */
export async function assertOwnerOrAdmin(orgId: string): Promise<void> {
  return requireRole(orgId, ["OWNER", "ADMIN"]);
}

/**
 * Wrapper para executar actions com tratamento de erro de RBAC
 * Retorna { ok: false, error: string } em caso de erro de permissão
 */
export async function withRbacGuard<T>(
  action: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const result = await action();
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Erro interno" };
  }
}
