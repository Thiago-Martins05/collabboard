import { config } from "dotenv";
import { db } from "../src/lib/db";
import { ensureUserPrimaryOrganization } from "../src/lib/tenant";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function debugBillingPage() {
  console.log("🔍 Debugando página de billing...\n");

  try {
    // 1. Buscar organização
    const org = await ensureUserPrimaryOrganization();
    if (!org) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização:", org.name);
    console.log("🆔 ID:", org.id);

    // 2. Buscar subscription
    const subscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    console.log("\n📊 Subscription encontrada:");
    console.log("📋 Dados completos:", JSON.stringify(subscription, null, 2));
    console.log("📈 Plano:", subscription?.plan);
    console.log("📈 Status:", subscription?.status);
    console.log("📈 Customer ID:", subscription?.stripeCustomerId);

    // 3. Buscar limites
    const featureLimit = await db.featureLimit.findUnique({
      where: { organizationId: org.id },
    });

    console.log("\n📊 Limites encontrados:");
    console.log("📋 Dados completos:", JSON.stringify(featureLimit, null, 2));
    console.log("📈 Max Boards:", featureLimit?.maxBoards);
    console.log("📈 Max Members:", featureLimit?.maxMembers);

    // 4. Simular a lógica da página
    const currentPlan = subscription?.plan || "FREE";
    const isPro = currentPlan === "PRO";

    console.log("\n🎯 Lógica da página:");
    console.log("📈 currentPlan:", currentPlan);
    console.log("📈 isPro:", isPro);

    // 5. Verificar se há problemas
    if (subscription?.plan === "PRO" && !isPro) {
      console.log("❌ PROBLEMA: Plano é PRO mas isPro é false!");
    } else if (subscription?.plan !== "PRO" && isPro) {
      console.log("❌ PROBLEMA: Plano não é PRO mas isPro é true!");
    } else {
      console.log("✅ Lógica da página está correta");
    }

    // 6. Verificar se há cache
    console.log("\n🔄 Verificando se há problemas de cache...");

    // Forçar uma nova consulta
    const freshSubscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    console.log("📊 Consulta fresca:");
    console.log("📈 Plano:", freshSubscription?.plan);
    console.log("📈 Status:", freshSubscription?.status);

    if (freshSubscription?.plan !== subscription?.plan) {
      console.log("❌ PROBLEMA: Dados diferentes entre consultas!");
    } else {
      console.log("✅ Dados consistentes entre consultas");
    }

    console.log("\n💡 Soluções possíveis:");
    console.log("1. Recarregue a página (Ctrl+F5)");
    console.log("2. Limpe o cache do navegador");
    console.log("3. Verifique se há algum problema de cache do Next.js");
  } catch (error) {
    console.error("❌ Erro ao debugar:", error);
  }
}

debugBillingPage().catch(console.error);
