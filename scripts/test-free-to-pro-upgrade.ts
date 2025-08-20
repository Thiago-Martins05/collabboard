import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testFreeToProUpgrade() {
  console.log("🧪 Testando upgrade de FREE para PRO...\n");

  try {
    // Buscar a organização FREE que criamos
    const organization = await db.organization.findFirst({
      where: {
        name: "Organização Teste FREE",
      },
      include: {
        subscription: true,
      },
    });

    if (!organization) {
      console.log("❌ Organização FREE não encontrada");
      console.log("💡 Execute primeiro: npx tsx scripts/create-free-org.ts");
      return;
    }

    const featureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    if (!organization) {
      console.log("❌ Organização FREE não encontrada");
      console.log("💡 Execute primeiro: npx tsx scripts/create-free-org.ts");
      return;
    }

    console.log("🏢 Organização encontrada:", organization.name);
    console.log("📊 Status atual:");
    console.log(`   Plano: ${organization.subscription?.plan || "FREE"}`);
    console.log(`   Status: ${organization.subscription?.status || "FREE"}`);
    console.log(`   Limites - Boards: ${featureLimit?.maxBoards || 5}`);
    console.log(`   Limites - Members: ${featureLimit?.maxMembers || 5}`);

    // Simular o processo de upgrade
    console.log("\n🔄 Simulando upgrade para PRO...");

    // 1. Atualizar subscription
    await db.subscription.update({
      where: { organizationId: organization.id },
      data: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    // 2. Atualizar feature limits
    await db.featureLimit.upsert({
      where: { organizationId: organization.id },
      update: {
        maxBoards: -1, // Ilimitado
        maxMembers: 50,
      },
      create: {
        organizationId: organization.id,
        maxBoards: -1, // Ilimitado
        maxMembers: 50,
      },
    });

    console.log("✅ Upgrade simulado com sucesso!");

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

    console.log("\n📊 Status após upgrade:");
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

    console.log("\n🎉 Teste de upgrade concluído com sucesso!");
    console.log("\n🔗 Para testar na interface:");
    console.log("1. Faça login com: test-free@example.com");
    console.log("2. Vá para: http://localhost:3000/billing");
    console.log("3. Você deve ver o plano PRO ativo");
    console.log(
      "4. Para testar o checkout real, clique em 'Gerenciar Assinatura'"
    );
  } catch (error) {
    console.error("❌ Erro ao testar upgrade:", error);
  }
}

testFreeToProUpgrade().catch(console.error);
