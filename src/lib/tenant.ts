import { db } from "@/lib/db";
import { slugify, randomSuffix } from "@/lib/slug";

/**
 * Garante que o usuário tenha uma organização e membership.
 * Se não houver, cria uma org "padrão" e atribui o usuário como OWNER.
 * Retorna o organizationId.
 */
export async function ensureDefaultOrganization(params: {
  userId: string;
  displayName?: string | null;
  email?: string | null;
}) {
  const { userId, displayName, email } = params;

  // Se já existe qualquer membership, não faz nada.
  const existing = await db.membership.findFirst({
    where: { userId },
    select: { organizationId: true },
  });
  if (existing) return existing.organizationId;

  // Deriva um nome/slug base
  const baseName =
    (displayName && displayName.trim()) ||
    (email ? email.split("@")[0] : "") ||
    "workspace";

  const baseSlug = slugify(baseName) || "workspace";

  // Gera um slug único
  let slug = baseSlug;
  let tries = 0;
  // tenta alguns sufixos curtos antes de usar timestamp
  while (await db.organization.findUnique({ where: { slug } })) {
    tries++;
    slug = `${baseSlug}-${randomSuffix(3)}`;
    if (tries > 5) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
  }

  // Cria a organização
  const org = await db.organization.create({
    data: {
      name: baseName,
      slug,
      ownerId: userId,
    },
  });

  // Cria Membership OWNER
  await db.membership.create({
    data: {
      userId,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  // Inicializa limites/assinatura (FREE)
  await db.featureLimit.create({
    data: { organizationId: org.id },
  });
  await db.subscription.create({
    data: {
      organizationId: org.id,
      plan: "FREE",
      status: "active",
    },
  });

  return org.id;
}
