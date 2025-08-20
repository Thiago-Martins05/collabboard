import { config } from "dotenv";
import { processUpgradeAfterCheckout } from "../src/app/(app)/billing/actions";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testProcessUpgrade() {
  console.log("🧪 Testando processamento de upgrade...\n");

  try {
    const result = await processUpgradeAfterCheckout();

    if (result.success) {
      console.log("✅ Processamento concluído com sucesso!");
      console.log(`📋 Resultado: ${result.message}`);
    } else {
      console.log("❌ Erro no processamento:");
      console.log(`📋 Erro: ${result.error}`);
    }
  } catch (error) {
    console.error("❌ Erro ao testar processamento:", error);
  }
}

testProcessUpgrade().catch(console.error);
