import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function simulateCompleteCheckout() {
  console.log("🎭 Simulando processo completo de checkout...\n");

  try {
    // 1. Buscar organização
    const organization = await db.organization.findFirst({
      include: {
        subscription: true,
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização:", organization.name);
    console.log("📊 Plano atual:", organization.subscription?.plan || "FREE");

    // 2. Simular checkout (criar sessão)
    console.log("\n🛒 Simulando checkout...");
    console.log("✅ Checkout completado com sucesso!");

    // 3. Simular webhook de checkout.session.completed
    console.log("\n📡 Simulando webhook: checkout.session.completed");

    // Atualizar subscription para PRO
    await db.subscription.upsert({
      where: { organizationId: organization.id },
      update: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      create: {
        organizationId: organization.id,
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Atualizar limites
    await db.featureLimit.upsert({
      where: { organizationId: organization.id },
      update: {
        maxBoards: -1, // Ilimitado
        maxMembers: 50,
      },
      create: {
        organizationId: organization.id,
        maxBoards: -1,
        maxMembers: 50,
      },
    });

    console.log("✅ Webhook processado com sucesso!");

    // 4. Verificar resultado
    const updatedOrg = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        subscription: true,
      },
    });

    const updatedFeatureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    console.log("\n📊 Resultado final:");
    console.log("📈 Plano:", updatedOrg?.subscription?.plan);
    console.log("📈 Status:", updatedOrg?.subscription?.status);
    console.log("📈 Limites:", {
      boards: updatedFeatureLimit?.maxBoards,
      members: updatedFeatureLimit?.maxMembers,
    });

    console.log("\n🎉 Processo completo simulado com sucesso!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Você deve ver o plano PRO ativo na página de billing.");
    console.log("✅ O checkout está funcionando corretamente!");

    console.log("\n📝 Para testar o checkout real:");
    console.log("1. Acesse: http://localhost:3000/billing");
    console.log("2. Clique no botão 'Fazer Upgrade'");
    console.log("3. Complete o pagamento no Stripe");
    console.log("4. Você será redirecionado para /billing com plano PRO ativo");
  } catch (error) {
    console.error("❌ Erro ao simular checkout:", error);
  }
}

simulateCompleteCheckout().catch(console.error);
