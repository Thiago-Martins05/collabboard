import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function checkDbStatus() {
  console.log("🔍 Verificando status do banco de dados...\n");

  try {
    // 1. Buscar todas as organizações
    const organizations = await db.organization.findMany({
      include: {
        subscription: true,
      },
    });

    console.log("🏢 Organizações encontradas:", organizations.length);

    organizations.forEach((org, index) => {
      console.log(`\n${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Plano: ${org.subscription?.plan || "FREE"}`);
      console.log(`   Status: ${org.subscription?.status || "FREE"}`);
      console.log(
        `   Customer ID: ${org.subscription?.stripeCustomerId || "N/A"}`
      );
    });

    // 2. Buscar todos os limites
    const featureLimits = await db.featureLimit.findMany();

    console.log("\n📊 Limites encontrados:");
    featureLimits.forEach((limit, index) => {
      console.log(`${index + 1}. Org ID: ${limit.organizationId}`);
      console.log(`   Max Boards: ${limit.maxBoards}`);
      console.log(`   Max Members: ${limit.maxMembers}`);
    });

    // 3. Verificar se há inconsistências
    console.log("\n🔍 Verificando inconsistências...");

    const orgWithPro = organizations.find(
      (org) => org.subscription?.plan === "PRO"
    );
    const orgWithFree = organizations.find(
      (org) => org.subscription?.plan === "FREE" || !org.subscription?.plan
    );

    if (orgWithPro) {
      console.log("✅ Organização com plano PRO encontrada:", orgWithPro.name);
    } else {
      console.log("❌ Nenhuma organização com plano PRO encontrada");
    }

    if (orgWithFree) {
      console.log(
        "✅ Organização com plano FREE encontrada:",
        orgWithFree.name
      );
    }

    // 4. Verificar se há problemas
    const orgWithoutSubscription = organizations.find(
      (org) => !org.subscription
    );
    if (orgWithoutSubscription) {
      console.log(
        "⚠️ Organização sem subscription:",
        orgWithoutSubscription.name
      );
    }

    console.log("\n💡 Recomendações:");
    console.log(
      "1. Se o plano está como PRO no banco mas aparece FREE na interface:"
    );
    console.log("   - Recarregue a página (Ctrl+F5)");
    console.log("   - Limpe o cache do navegador");
    console.log("   - Verifique se há cache do Next.js");
    console.log("2. Se o plano está como FREE no banco:");
    console.log("   - Execute o script de simulação novamente");
  } catch (error) {
    console.error("❌ Erro ao verificar banco:", error);
  }
}

checkDbStatus().catch(console.error);
