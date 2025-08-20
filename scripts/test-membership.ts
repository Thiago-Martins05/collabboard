import { config } from "dotenv";
import { requireMembership } from "../src/lib/rbac-guard";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testMembership() {
  console.log("🧪 Testando membership...\n");

  try {
    // Buscar uma organização existente
    const organization = await db.organization.findFirst({
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização encontrada:", organization.name);
    console.log("👥 Membros:", organization.memberships.length);

    if (organization.memberships.length === 0) {
      console.log("❌ Nenhum membro na organização");
      return;
    }

    const firstMember = organization.memberships[0];
    console.log("👤 Primeiro membro:", firstMember.user.email);

    // Testar requireMembership
    console.log("🔍 Testando requireMembership...");
    await requireMembership(organization.id);
    console.log("✅ requireMembership funcionou");
  } catch (error) {
    console.error("❌ Erro ao testar membership:", error);
  }
}

testMembership().catch(console.error);
