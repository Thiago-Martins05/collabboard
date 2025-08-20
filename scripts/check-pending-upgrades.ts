import { config } from "dotenv";
import { db } from "../src/lib/db";
import { PLANS } from "../src/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function checkPendingUpgrades() {
  console.log("🔍 Verificando upgrades pendentes...\n");

  try {
    // Buscar organizações FREE que têm customer ID (fizeram checkout)
    const pendingOrganizations = await db.organization.findMany({
      where: {
        subscription: {
          AND: [{ plan: "FREE" }, { stripeCustomerId: { not: null } }],
        },
      },
      include: {
        subscription: true,
      },
    });

    if (pendingOrganizations.length === 0) {
      console.log("✅ Nenhum upgrade pendente encontrado");
      return;
    }

    console.log(
      `🔄 Encontradas ${pendingOrganizations.length} organização(s) com checkout pendente:`
    );

    for (const org of pendingOrganizations) {
      console.log(`   - ${org.name} (${org.subscription?.stripeCustomerId})`);
    }

    console.log("\n💡 Para processar os upgrades, execute:");
    console.log("   npx tsx scripts/auto-upgrade-after-checkout.ts");

    // Também verificar organizações que já são PRO
    const proOrganizations = await db.organization.findMany({
      where: {
        subscription: {
          plan: "PRO",
        },
      },
      include: {
        subscription: true,
      },
    });

    console.log(`\n✅ Organizações PRO ativas: ${proOrganizations.length}`);
    for (const org of proOrganizations) {
      console.log(`   - ${org.name} (${org.subscription?.stripeCustomerId})`);
    }
  } catch (error) {
    console.error("❌ Erro ao verificar upgrades pendentes:", error);
  }
}

checkPendingUpgrades().catch(console.error);
