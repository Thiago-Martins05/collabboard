import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function moveUserToPro() {
  console.log("🔧 Movendo usuário para organização PRO...\n");

  try {
    // 1. Buscar a organização PRO
    const proOrg = await db.organization.findFirst({
      where: {
        subscription: {
          plan: "PRO",
        },
      },
      include: {
        subscription: true,
      },
    });

    if (!proOrg) {
      console.log("❌ Nenhuma organização PRO encontrada");
      return;
    }

    console.log("✅ Organização PRO encontrada:");
    console.log(`   Nome: ${proOrg.name}`);
    console.log(`   ID: ${proOrg.id}`);
    console.log(`   Plano: ${proOrg.subscription?.plan}`);

    // 2. Buscar o usuário thiagoroyal05@icloud.com
    const user = await db.user.findUnique({
      where: { email: "thiagoroyal05@icloud.com" },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscription: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log("❌ Usuário thiagoroyal05@icloud.com não encontrado");
      return;
    }

    console.log("✅ Usuário encontrado:");
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Organizações atuais: ${user.memberships.length}`);

    // 3. Verificar se já está na organização PRO
    const alreadyInPro = user.memberships.find(
      (m) => m.organizationId === proOrg.id
    );
    if (alreadyInPro) {
      console.log("✅ Usuário já está na organização PRO!");
      return;
    }

    // 4. Remover da organização FREE
    const freeMembership = user.memberships.find(
      (m) => m.organization.subscription?.plan === "FREE"
    );
    if (freeMembership) {
      console.log("🗑️ Removendo da organização FREE...");
      await db.membership.delete({
        where: { id: freeMembership.id },
      });
      console.log("✅ Removido da organização FREE");
    }

    // 5. Adicionar à organização PRO
    console.log("➕ Adicionando à organização PRO...");
    await db.membership.create({
      data: {
        userId: user.id,
        organizationId: proOrg.id,
        role: "OWNER",
      },
    });
    console.log("✅ Adicionado à organização PRO como OWNER");

    // 6. Verificar resultado
    const updatedUser = await db.user.findUnique({
      where: { email: "thiagoroyal05@icloud.com" },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                subscription: true,
              },
            },
          },
        },
      },
    });

    console.log("\n📊 Status final do usuário:");
    console.log(`   Nome: ${updatedUser?.name}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Organizações: ${updatedUser?.memberships.length}`);

    updatedUser?.memberships.forEach((membership, index) => {
      console.log(`     ${index + 1}. ${membership.organization.name}`);
      console.log(`        ID: ${membership.organization.id}`);
      console.log(`        Role: ${membership.role}`);
      console.log(
        `        Plano: ${membership.organization.subscription?.plan || "FREE"}`
      );
      console.log(
        `        Status: ${
          membership.organization.subscription?.status || "FREE"
        }`
      );
    });

    console.log("\n🎉 Usuário movido com sucesso!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Agora deve mostrar o plano PRO corretamente");
  } catch (error) {
    console.error("❌ Erro ao mover usuário:", error);
  }
}

moveUserToPro().catch(console.error);
