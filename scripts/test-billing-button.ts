import { config } from "dotenv";
import { createCheckoutSession } from "../src/app/(app)/billing/actions";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testBillingButton() {
  console.log("🧪 Testando simulação do botão de upgrade...\n");

  try {
    // Simular os dados que vêm do componente
    const organizationId = "cmehs1rg400016ap4m2g8qcm9"; // ID da organização de teste
    const plan = "PRO";

    console.log("🔧 Simulando clique no botão 'Fazer Upgrade'");
    console.log("📋 Dados:", { organizationId, plan });

    // Simular a chamada da action
    console.log("🔄 Chamando createCheckoutSession...");
    const formData = new FormData();
    const result = await createCheckoutSession(formData);

    console.log("📤 Resultado:", result);

    if (result.error) {
      console.log("❌ Erro retornado:", result.error);
      return;
    }

    if (result.url) {
      console.log("✅ URL gerada:", result.url);
      console.log("🎉 Sucesso! O checkout deve abrir em:", result.url);
    } else {
      console.log("⚠️ Nenhuma URL retornada");
    }
  } catch (error) {
    console.error("❌ Erro ao simular botão:", error);
  }
}

testBillingButton().catch(console.error);
