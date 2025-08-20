import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function createFreeOrganization() {
  console.log("🧪 Criando organização FREE para teste...\n");

  try {
    // Criar usuário de teste se não existir
    const userEmail = "test-free@example.com";
    console.log("👤 Criando usuário:", userEmail);

    const user = await db.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: "Usuário Teste FREE",
      },
    });

    console.log("✅ Usuário criado:", user.id);

    // Criar nova organização FREE
    const orgName = "Organização Teste FREE";
    console.log("🏢 Criando organização:", orgName);

    const organization = await db.organization.create({
      data: {
        name: orgName,
        slug: `org-teste-free-${Date.now()}`,
        ownerId: user.id,
      },
    });

    console.log("✅ Organização criada:", organization.id);

    // Adicionar usuário como OWNER
    console.log("👥 Adicionando usuário como OWNER...");

    const membership = await db.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    console.log("✅ Membro adicionado:", membership.role);

    // Criar subscription FREE
    console.log("📋 Criando subscription FREE...");

    const subscription = await db.subscription.create({
      data: {
        organizationId: organization.id,
        plan: "FREE",
        status: "FREE",
      },
    });

    console.log("✅ Subscription FREE criada");

    // Criar feature limits FREE
    console.log("🔒 Criando feature limits FREE...");

    const featureLimit = await db.featureLimit.create({
      data: {
        organizationId: organization.id,
        maxBoards: 5,
        maxMembers: 5,
      },
    });

    console.log("✅ Feature limits criados");

    console.log("\n🎉 Organização FREE criada com sucesso!");
    console.log("📊 Resumo:");
    console.log(`   Organização: ${organization.name} (${organization.id})`);
    console.log(`   Usuário: ${user.email} (${user.id})`);
    console.log(`   Plano: FREE`);
    console.log(`   Role: OWNER`);
    console.log("\n🔗 Para testar o upgrade:");
    console.log("   1. Faça login com: test-free@example.com");
    console.log("   2. Vá para: http://localhost:3000/billing");
    console.log("   3. Clique em 'Fazer Upgrade' no plano PRO");
  } catch (error) {
    console.error("❌ Erro ao criar organização FREE:", error);
  }
}

createFreeOrganization().catch(console.error);
