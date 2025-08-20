import { db } from "@/lib/db";
import { mockWebhookSuccess } from "@/app/(app)/billing/actions";

async function main() {
  console.log("🧪 Testando sistema de billing...\n");

  try {
    // Busca a primeira organização
    const org = await db.organization.findFirst();
    if (!org) {
      console.log(
        "❌ Nenhuma organização encontrada. Crie uma organização primeiro."
      );
      return;
    }

    console.log(`📋 Organização: ${org.name} (${org.id})`);

    // Verifica subscription atual
    const subscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    console.log(`📊 Plano atual: ${subscription?.plan || "FREE"}`);

    // Verifica limites atuais
    const limits = await db.featureLimit.findUnique({
      where: { organizationId: org.id },
    });

    console.log(`📈 Limites atuais:`);
    console.log(`   - Boards: ${limits?.maxBoards || 5}`);
    console.log(`   - Membros: ${limits?.maxMembers || 5}`);

    // Simula upgrade para PRO
    console.log("\n🚀 Simulando upgrade para PRO...");
    const result = await mockWebhookSuccess(org.id);

    if (result.success) {
      console.log("✅ Upgrade simulado com sucesso!");

      // Verifica mudanças
      const newSubscription = await db.subscription.findUnique({
        where: { organizationId: org.id },
      });

      const newLimits = await db.featureLimit.findUnique({
        where: { organizationId: org.id },
      });

      console.log(`📊 Novo plano: ${newSubscription?.plan}`);
      console.log(`📈 Novos limites:`);
      console.log(
        `   - Boards: ${newLimits?.maxBoards} (${
          newLimits?.maxBoards === -1 ? "Ilimitado" : newLimits?.maxBoards
        })`
      );
      console.log(`   - Membros: ${newLimits?.maxMembers}`);

      console.log("\n🎯 Teste manual:");
      console.log("   1. Acesse /billing");
      console.log("   2. Verifique se o plano PRO está ativo");
      console.log("   3. Tente criar mais de 5 boards (deve funcionar)");
      console.log("   4. Verifique se os banners de limite desapareceram");
    } else {
      console.log("❌ Erro ao simular upgrade:", result.error);
    }
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
  } finally {
    await db.$disconnect();
  }
}

// Executa o script
main().catch(console.error);
