import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testWebAction() {
  console.log("🧪 Testando action da aplicação web...\n");

  try {
    // Fazer uma requisição POST para a action
    const response = await fetch("http://localhost:3000/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: "cmehs1rg400016ap4m2g8qcm9", // ID da organização de teste
        plan: "PRO",
      }),
    });

    console.log("📤 Status da resposta:", response.status);
    console.log("📋 Headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Resposta:", data);
    } else {
      const errorText = await response.text();
      console.log("❌ Erro:", errorText);
    }
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
  }
}

testWebAction().catch(console.error);
