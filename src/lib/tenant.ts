import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { slugify } from "@/lib/utils";

/**
 * Garante que exista um registro em `User` correspondente à sessão atual.
 * Retorna o usuário do banco (com id válido) ou null se não autenticado.
 */
async function ensureDbUserFromSession() {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return null;

  // Procura por e-mail (mais estável após reset)
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

/**
 * Retorna a primeira organização do usuário (pela Membership),
 * ou null caso não tenha.
 */
export async function getUserPrimaryOrganization(userId: string) {
  if (!userId) return null;
  return db.organization.findFirst({
    where: { memberships: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Garante que o usuário logado tenha uma organização “pessoal”.
 * - Cria o usuário no banco se necessário (via e-mail da sessão)
 * - Cria Organization + Membership OWNER (usa `ownerId` conforme seu schema)
 * - Cria FeatureLimit se existir no schema
 * Retorna a Organization.
 */
export async function ensureUserPrimaryOrganization() {
  const dbUser = await ensureDbUserFromSession();
  if (!dbUser) return null;

  // Já possui alguma org?
  const existing = await getUserPrimaryOrganization(dbUser.id);
  if (existing) return existing;

  // Nome/slug base
  const baseName = `${dbUser.name?.trim() || "Workspace"} - Pessoal`;
  let baseSlug = slugify(baseName);
  let slug = baseSlug;
  let suffix = 1;

  // Garante slug único
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const taken = await db.organization.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  // Cria org + membership OWNER (usa ownerId pois seu schema exige)
  const org = await db.$transaction(async (tx) => {
    const createdOrg = await tx.organization.create({
      data: {
        name: baseName,
        slug,
        ownerId: dbUser.id, // ✅ agora usamos o ID do usuário que existe no banco
      },
    });

    await tx.membership.create({
      data: {
        organizationId: createdOrg.id,
        userId: dbUser.id,
        role: "OWNER",
      },
    });

    // Se seu schema tiver FeatureLimit (unique por organizationId), cria também.
    try {
      // @ts-expect-error — ignora caso o modelo não exista no schema
      await tx.featureLimit?.create({
        data: { organizationId: createdOrg.id },
      });
    } catch {
      /* noop */
    }

    return createdOrg;
  });

  return org;
}
