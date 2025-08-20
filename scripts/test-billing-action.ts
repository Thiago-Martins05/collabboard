import { config } from "dotenv";
import { createCheckoutSession } from "@/app/(app)/billing/actions";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testBillingAction() {
  console.log("🧪 Testando action de billing...\n");

  try {
    // Testar criação de sessão de checkout
    console.log("🛒 Testando criação de sessão de checkout...");
    const result = await createCheckoutSession("test-org-id", "PRO");

    console.log("Resultado:", result);

    if (result.error) {
      console.log("❌ Erro:", result.error);
    } else if (result.url) {
      console.log("✅ URL do checkout:", result.url);
    }
  } catch (error) {
    console.error("❌ Erro ao testar action:", error);
  }
}

testBillingAction().catch(console.error);
