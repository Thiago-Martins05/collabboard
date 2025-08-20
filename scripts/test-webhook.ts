import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testWebhook() {
  console.log("🧪 Testando webhook do Stripe...\n");

  try {
    // Buscar uma organização existente
    const organization = await db.organization.findFirst({
      include: {
        subscription: true,
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    // Buscar os limites da organização
    const featureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização:", organization.name);
    console.log("📊 Plano atual:", organization.subscription?.plan || "FREE");
    console.log("📈 Limites atuais:", {
      boards: featureLimit?.maxBoards || 5,
      members: featureLimit?.maxMembers || 5,
    });

    // Simular o processamento do webhook
    console.log("\n🔄 Simulando webhook de checkout completado...");

    // Atualiza a subscription para PRO
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

    // Atualiza os limites da organização
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

    // Verificar se foi atualizado
    const updatedOrg = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        subscription: true,
      },
    });

    const updatedFeatureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    console.log("\n📊 Após o webhook:");
    console.log("📈 Plano:", updatedOrg?.subscription?.plan);
    console.log("📈 Status:", updatedOrg?.subscription?.status);
    console.log("📈 Limites:", {
      boards: updatedFeatureLimit?.maxBoards,
      members: updatedFeatureLimit?.maxMembers,
    });

    console.log("\n🎉 Teste concluído! A organização agora tem plano PRO.");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Você deve ver o plano PRO ativo na página de billing.");
  } catch (error) {
    console.error("❌ Erro ao testar webhook:", error);
  }
}

testWebhook().catch(console.error);
