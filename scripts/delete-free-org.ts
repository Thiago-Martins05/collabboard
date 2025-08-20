import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function deleteFreeOrg() {
  console.log("🗑️ Deletando organização FREE vazia...\n");

  try {
    // 1. Buscar a organização FREE
    const freeOrg = await db.organization.findFirst({
      where: {
        subscription: {
          plan: "FREE",
        },
      },
      include: {
        memberships: true,
        subscription: true,
      },
    });

    if (!freeOrg) {
      console.log("❌ Nenhuma organização FREE encontrada");
      return;
    }

    console.log("⚠️ Organização FREE encontrada:");
    console.log(`   Nome: ${freeOrg.name}`);
    console.log(`   ID: ${freeOrg.id}`);
    console.log(`   Plano: ${freeOrg.subscription?.plan}`);
    console.log(`   Membros: ${freeOrg.memberships.length}`);

    // 2. Deletar completamente
    console.log("\n🗑️ Deletando organização FREE...");

    // Deletar subscription
    if (freeOrg.subscription) {
      await db.subscription.delete({
        where: { id: freeOrg.subscription.id },
      });
      console.log("✅ Subscription deletada");
    }

    // Deletar feature limits
    await db.featureLimit.deleteMany({
      where: { organizationId: freeOrg.id },
    });
    console.log("✅ Feature limits deletados");

    // Deletar organização
    await db.organization.delete({
      where: { id: freeOrg.id },
    });
    console.log("✅ Organização deletada");

    // 3. Verificar resultado final
    const finalOrganizations = await db.organization.findMany({
      include: {
        subscription: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("\n📊 Status final:");
    finalOrganizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Plano: ${org.subscription?.plan || "FREE"}`);
      console.log(`   Status: ${org.subscription?.status || "FREE"}`);
      console.log(`   Membros:`);
      org.memberships.forEach((member) => {
        console.log(`     - ${member.user.email} (${member.role})`);
      });
    });

    console.log("\n🎉 Organização FREE deletada!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Agora deve mostrar o plano PRO corretamente");
  } catch (error) {
    console.error("❌ Erro ao deletar organização:", error);
  }
}

deleteFreeOrg().catch(console.error);
