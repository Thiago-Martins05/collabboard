import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function createTestUser() {
  console.log("🧪 Criando usuário de teste...\n");

  try {
    // Buscar uma organização existente
    const organization = await db.organization.findFirst();

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização encontrada:", organization.name);

    // Criar usuário
    const userEmail = "test@example.com";
    console.log("👤 Criando usuário:", userEmail);

    const user = await db.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: "Usuário Teste",
      },
    });

    console.log("✅ Usuário criado:", user.id);

    // Adicionar como membro da organização
    console.log("👥 Adicionando como membro...");

    const membership = await db.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    console.log("✅ Membro adicionado:", membership.role);

    // Verificar se funcionou
    const members = await db.membership.count({
      where: { organizationId: organization.id },
    });

    console.log(`📊 Total de membros na organização: ${members}`);
  } catch (error) {
    console.error("❌ Erro ao criar usuário de teste:", error);
  }
}

createTestUser().catch(console.error);
