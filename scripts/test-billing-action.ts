import { config } from "dotenv";
import { createCheckoutSession } from "../src/app/(app)/billing/actions";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testBillingAction() {
  console.log("🧪 Testando action de billing...\n");

  try {
    // Teste com uma organização de exemplo
    const organizationId = "test-org-id";
    const plan = "PRO";

    console.log("📋 Parâmetros:", { organizationId, plan });

    const result = await createCheckoutSession(organizationId, plan);

    console.log("📤 Resultado:", result);

    if (result.error) {
      console.log("❌ Erro:", result.error);
    } else if (result.url) {
      console.log("✅ URL gerada:", result.url);
    } else {
      console.log("⚠️ Nenhum resultado retornado");
    }
  } catch (error) {
    console.error("❌ Erro ao testar billing action:", error);
  }
}

testBillingAction().catch(console.error);
