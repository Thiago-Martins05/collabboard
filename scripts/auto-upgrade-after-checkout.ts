import { config } from "dotenv";
import { db } from "../src/lib/db";
import { PLANS } from "../src/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function autoUpgradeAfterCheckout() {
  console.log("🤖 Auto-upgrade após checkout...\n");

  try {
    // Buscar organizações FREE que têm customer ID (fizeram checkout)
    const organizations = await db.organization.findMany({
      where: {
        subscription: {
          AND: [{ plan: "FREE" }, { stripeCustomerId: { not: null } }],
        },
      },
      include: {
        subscription: true,
      },
    });

    if (organizations.length === 0) {
      console.log("✅ Nenhuma organização FREE com checkout pendente");
      return;
    }

    console.log(
      `🔄 Encontradas ${organizations.length} organização(s) para upgrade`
    );

    for (const organization of organizations) {
      console.log(`\n🏢 Processando: ${organization.name}`);
      console.log(
        `   Customer ID: ${organization.subscription?.stripeCustomerId}`
      );

      // Atualizar subscription para PRO
      await db.subscription.update({
        where: { organizationId: organization.id },
        data: {
          plan: "PRO",
          status: "PRO",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });

      // Atualizar feature limits
      await db.featureLimit.upsert({
        where: { organizationId: organization.id },
        update: {
          maxBoards: PLANS.PRO.limits.boards,
          maxMembers: PLANS.PRO.limits.members,
        },
        create: {
          organizationId: organization.id,
          maxBoards: PLANS.PRO.limits.boards,
          maxMembers: PLANS.PRO.limits.members,
        },
      });

      console.log(`✅ ${organization.name} atualizada para PRO`);
    }

    console.log("\n🎉 Auto-upgrade concluído!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Todas as organizações com checkout devem estar PRO");
  } catch (error) {
    console.error("❌ Erro no auto-upgrade:", error);
  }
}

autoUpgradeAfterCheckout().catch(console.error);
