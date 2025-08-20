import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function cleanupDuplicate() {
  console.log("🧹 Limpando organização duplicada...\n");

  try {
    // 1. Buscar a organização FREE
    const freeOrg = await db.organization.findFirst({
      where: {
        subscription: {
          plan: "FREE",
        },
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
        subscription: true,
      },
    });

    if (!freeOrg) {
      console.log("❌ Nenhuma organização FREE encontrada");
      return;
    }

    console.log("⚠️ Organização FREE encontrada:");
    console.log(`   Nome: ${freeOrg.name}`);
    console.log(`   ID: ${freeOrg.id}`);
    console.log(`   Plano: ${freeOrg.subscription?.plan}`);
    console.log(`   Membros: ${freeOrg.memberships.length}`);

    // 2. Verificar se há dados importantes
    const boards = await db.board.count({
      where: { organizationId: freeOrg.id },
    });

    const columns = await db.column.count({
      where: {
        board: { organizationId: freeOrg.id },
      },
    });

    const cards = await db.card.count({
      where: {
        column: {
          board: { organizationId: freeOrg.id },
        },
      },
    });

    console.log(`   Boards: ${boards}`);
    console.log(`   Columns: ${columns}`);
    console.log(`   Cards: ${cards}`);

    if (boards > 0 || columns > 0 || cards > 0) {
      console.log("\n⚠️ ATENÇÃO: Esta organização tem dados!");
      console.log("   Você quer deletar mesmo assim?");
      console.log("   Os dados serão perdidos permanentemente.");

      // Por segurança, vou apenas remover os membros
      console.log("\n🔧 Removendo apenas os membros...");
      await db.membership.deleteMany({
        where: { organizationId: freeOrg.id },
      });
      console.log("✅ Membros removidos");
    } else {
      // 3. Deletar a organização FREE
      console.log("\n🗑️ Deletando organização FREE...");

      // Deletar membros primeiro
      await db.membership.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar subscription
      await db.subscription.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar feature limits
      await db.featureLimit.deleteMany({
        where: { organizationId: freeOrg.id },
      });

      // Deletar organização
      await db.organization.delete({
        where: { id: freeOrg.id },
      });

      console.log("✅ Organização FREE deletada");
    }

    // 4. Verificar resultado final
    const finalOrganizations = await db.organization.findMany({
      include: {
        subscription: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("\n📊 Status final:");
    finalOrganizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Plano: ${org.subscription?.plan || "FREE"}`);
      console.log(`   Status: ${org.subscription?.status || "FREE"}`);
      console.log(`   Membros:`);
      org.memberships.forEach((member) => {
        console.log(`     - ${member.user.email} (${member.role})`);
      });
    });

    console.log("\n🎉 Limpeza concluída!");
    console.log("🔗 Acesse: http://localhost:3000/billing");
    console.log("📋 Agora deve mostrar o plano PRO corretamente");
  } catch (error) {
    console.error("❌ Erro ao limpar duplicata:", error);
  }
}

cleanupDuplicate().catch(console.error);
