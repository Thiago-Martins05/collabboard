import { db } from "@/lib/db";
import { setupTestLimits, restoreNormalLimits } from "@/lib/test-limits";

async function main() {
  console.log("🧪 Iniciando testes de limites...\n");

  try {
    // Busca a primeira organização (para teste)
    const org = await db.organization.findFirst();
    if (!org) {
      console.log(
        "❌ Nenhuma organização encontrada. Crie uma organização primeiro."
      );
      return;
    }

    console.log(`📋 Organização: ${org.name} (${org.id})`);

    // Configura limites de teste
    await setupTestLimits(org.id);

    // Mostra estatísticas atuais
    const boards = await db.board.count({ where: { organizationId: org.id } });
    const members = await db.membership.count({
      where: { organizationId: org.id },
    });

    console.log("\n📊 Estatísticas atuais:");
    console.log(`   - Boards: ${boards}`);
    console.log(`   - Membros: ${members}`);

    console.log("\n🎯 Teste manual:");
    console.log("   1. Acesse o dashboard");
    console.log("   2. Tente criar um segundo board (deve mostrar erro)");
    console.log("   3. Vá em Settings > Members");
    console.log("   4. Tente convidar um terceiro membro (deve mostrar erro)");
    console.log("   5. Verifique se os banners aparecem");

    console.log("\n💡 Para restaurar limites normais, execute:");
    console.log("   await restoreNormalLimits(org.id)");
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  } finally {
    await db.$disconnect();
  }
}

// Executa o script
main().catch(console.error);
