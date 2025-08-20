import { config } from "dotenv";
import { db } from "../src/lib/db";
import { PLANS } from "../src/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function simulateWebhookAfterCheckout() {
  console.log("🎭 Simulando webhook após checkout...\n");

  try {
    // Buscar a organização mais recente que fez checkout
    const organization = await db.organization.findFirst({
      where: {
        subscription: {
          stripeCustomerId: {
            not: null,
          },
        },
      },
      include: {
        subscription: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização com checkout encontrada");
      console.log("💡 Faça um checkout primeiro e depois execute este script");
      return;
    }

    const featureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização com checkout encontrada");
      console.log("💡 Faça um checkout primeiro e depois execute este script");
      return;
    }

    console.log("🏢 Organização encontrada:", organization.name);
    console.log("📊 Status atual:");
    console.log(`   Plano: ${organization.subscription?.plan || "FREE"}`);
    console.log(`   Status: ${organization.subscription?.status || "FREE"}`);
    console.log(
      `   Customer ID: ${organization.subscription?.stripeCustomerId}`
    );
    console.log(`   Limites - Boards: ${featureLimit?.maxBoards || 5}`);
    console.log(`   Limites - Members: ${featureLimit?.maxMembers || 5}`);

    // Simular webhook checkout.session.completed
    console.log("\n🔄 Simulando webhook: checkout.session.completed");

    // 1. Atualizar subscription para PRO
    await db.subscription.update({
      where: { organizationId: organization.id },
      data: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    console.log("✅ Subscription atualizada para PRO");

    // 2. Atualizar feature limits
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

    console.log("✅ Feature limits atualizados");

    // 3. Verificar resultado
    const updatedOrg = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        subscription: true,
      },
    });

    const updatedFeatureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    console.log("\n📊 Status após webhook:");
    console.log(`   Plano: ${updatedOrg?.subscription?.plan}`);
    console.log(`   Status: ${updatedOrg?.subscription?.status}`);
    console.log(
      `   Próxima cobrança: ${updatedOrg?.subscription?.currentPeriodEnd?.toLocaleDateString(
        "pt-BR"
      )}`
    );
    console.log(
      `   Limites - Boards: ${
        updatedFeatureLimit?.maxBoards === -1
          ? "Ilimitado"
          : updatedFeatureLimit?.maxBoards
      }`
    );
    console.log(`   Limites - Members: ${updatedFeatureLimit?.maxMembers}`);

    console.log("\n🎉 Webhook simulado com sucesso!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Você deve ver o plano PRO ativo na página de billing.");
  } catch (error) {
    console.error("❌ Erro ao simular webhook:", error);
  }
}

simulateWebhookAfterCheckout().catch(console.error);
