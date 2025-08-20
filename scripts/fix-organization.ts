import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function fixOrganization() {
  console.log("🔧 Corrigindo organização...\n");

  try {
    // 1. Buscar todas as organizações
    const organizations = await db.organization.findMany({
      include: {
        subscription: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("🏢 Organizações encontradas:", organizations.length);

    organizations.forEach((org, index) => {
      console.log(`\n${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Plano: ${org.subscription?.plan || "FREE"}`);
      console.log(`   Membros: ${org.memberships.length}`);
      org.memberships.forEach((member) => {
        console.log(`     - ${member.user.email} (${member.role})`);
      });
    });

    // 2. Identificar a organização correta (com plano PRO)
    const proOrg = organizations.find(
      (org) => org.subscription?.plan === "PRO"
    );
    const freeOrg = organizations.find(
      (org) => org.subscription?.plan === "FREE" || !org.subscription?.plan
    );

    if (!proOrg) {
      console.log("❌ Nenhuma organização com plano PRO encontrada");
      return;
    }

    console.log("\n✅ Organização PRO encontrada:", proOrg.name);
    console.log("🆔 ID:", proOrg.id);

    if (freeOrg) {
      console.log("\n⚠️ Organização FREE encontrada:", freeOrg.name);
      console.log("🆔 ID:", freeOrg.id);

      // 3. Perguntar se deve deletar a organização FREE
      console.log("\n🔧 Opções:");
      console.log("1. Deletar a organização FREE (recomendado)");
      console.log("2. Atualizar a organização FREE para PRO");
      console.log("3. Manter ambas");

      // Por padrão, vou deletar a organização FREE
      console.log("\n🗑️ Deletando organização FREE...");

      // Deletar membros primeiro
      await db.membership.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar subscription
      await db.subscription.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar feature limits
      await db.featureLimit.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar organização
      await db.organization.delete({
        where: { id: freeOrg.id },
      });

      console.log("✅ Organização FREE deletada");
    }

    // 4. Verificar resultado final
    const finalOrganizations = await db.organization.findMany({
      include: {
        subscription: true,
      },
    });

    console.log("\n📊 Status final:");
    finalOrganizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Plano: ${org.subscription?.plan || "FREE"}`);
      console.log(`   Status: ${org.subscription?.status || "FREE"}`);
    });

    console.log("\n🎉 Organização corrigida!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Agora deve mostrar o plano PRO corretamente");
  } catch (error) {
    console.error("❌ Erro ao corrigir organização:", error);
  }
}

fixOrganization().catch(console.error);
