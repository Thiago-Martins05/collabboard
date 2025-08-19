// src/lib/rbac.ts
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

/** Garante e retorna o usuário do BANCO correspondente à sessão atual (cria se não existir). */
async function ensureDbUserFromSession() {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return null;

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name: session?.user?.name ?? null,
        image: session?.user?.image ?? null,
      },
    });
  }
  return user;
}

/** Retorna o papel do usuário (do BANCO) na org, ou null se não houver membership. */
export async function getUserRole(
  organizationId: string
): Promise<OrgRole | null> {
  const dbUser = await ensureDbUserFromSession();
  if (!dbUser) return null;

  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: dbUser.id, organizationId } },
    select: { role: true },
  });
  return (m?.role as OrgRole) ?? null;
}

export async function isOrgOwner(orgId: string) {
  return (await getUserRole(orgId)) === "OWNER";
}
export async function isOrgAdmin(orgId: string) {
  const r = await getUserRole(orgId);
  return r === "OWNER" || r === "ADMIN";
}

/**
 * Garante que exista um Membership para o usuário (do BANCO) na org.
 * Se não existir, cria como OWNER. Idempotente.
 */
export async function ensureOwnerMembership(organizationId: string) {
  const dbUser = await ensureDbUserFromSession();
  if (!dbUser) return { ok: false as const, error: "Not authenticated" };

  const existing = await db.membership.findUnique({
    where: { userId_organizationId: { userId: dbUser.id, organizationId } },
    select: { id: true },
  });
  if (existing) return { ok: true as const };

  await db.membership.create({
    data: { userId: dbUser.id, organizationId, role: "OWNER" },
  });

  return { ok: true as const };
}

/** Lança erro se o usuário (do BANCO) não tiver um dos papéis exigidos. */
export async function requireRole(organizationId: string, roles: OrgRole[]) {
  const role = await getUserRole(organizationId);
  if (!role || !roles.includes(role)) {
    throw new Error("Forbidden: insufficient role");
  }
}
