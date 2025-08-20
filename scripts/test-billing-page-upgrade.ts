import { config } from "dotenv";
import { db } from "../src/lib/db";
import { PLANS } from "../src/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testBillingPageUpgrade() {
  console.log("🧪 Testando fluxo de upgrade na página de billing...\n");

  try {
    // 1. Verificar organizações FREE com customer ID
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
      console.log("✅ Nenhuma organização com upgrade pendente");
      console.log("💡 Para testar, faça um checkout primeiro");
      return;
    }

    console.log(
      `🔄 Encontradas ${pendingOrganizations.length} organização(s) com checkout pendente:`
    );

    for (const org of pendingOrganizations) {
      console.log(`   - ${org.name} (${org.subscription?.stripeCustomerId})`);
    }

    // 2. Simular o que acontece quando o usuário acessa /billing?success=true
    console.log(
      "\n🔄 Simulando acesso à página de billing com success=true..."
    );

    for (const organization of pendingOrganizations) {
      console.log(`\n🏢 Processando: ${organization.name}`);

      // Simular o processamento automático
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

    // 3. Verificar resultado
    console.log("\n📊 Verificando resultado...");

    const updatedOrganizations = await db.organization.findMany({
      where: {
        id: { in: pendingOrganizations.map((org) => org.id) },
      },
      include: {
        subscription: true,
      },
    });

    for (const org of updatedOrganizations) {
      const featureLimit = await db.featureLimit.findUnique({
        where: { organizationId: org.id },
      });

      console.log(`\n🏢 ${org.name}:`);
      console.log(`   Plano: ${org.subscription?.plan}`);
      console.log(`   Status: ${org.subscription?.status}`);
      console.log(
        `   Limites - Boards: ${
          featureLimit?.maxBoards === -1 ? "Ilimitado" : featureLimit?.maxBoards
        }`
      );
      console.log(`   Limites - Members: ${featureLimit?.maxMembers}`);
    }

    console.log("\n🎉 Teste concluído!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 A página deve mostrar o plano PRO ativo");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testBillingPageUpgrade().catch(console.error);
