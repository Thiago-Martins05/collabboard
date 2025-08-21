// Script para testar o webhook do Stripe
// Execute com: node test-webhook.js

const BASE_URL = "http://localhost:3000";

async function testWebhook() {
  try {
    console.log("🧪 Testando webhook do Stripe...");

    // Verificar configuração
    console.log("\n📋 Verificando configuração...");
    const configResponse = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=config`
    );
    const configData = await configResponse.json();
    console.log("⚙️ Configuração:", configData);

    // Primeiro, vamos verificar o status atual
    console.log("\n📋 Verificando status atual...");
    const checkResponse = await fetch(
      `${BASE_URL}/api/webhooks/stripe?organizationId=test&action=check`
    );
    const checkData = await checkResponse.json();
    console.log("📊 Status atual:", checkData);

    // Agora vamos simular o webhook
    console.log("\n🎭 Simulando webhook do Stripe...");
    const simulateResponse = await fetch(
      `${BASE_URL}/api/webhooks/stripe?organizationId=test&action=simulate`
    );
    const simulateData = await simulateResponse.json();
    console.log("✅ Resultado da simulação:", simulateData);

    // Verificar novamente o status
    console.log("\n📋 Verificando status após simulação...");
    const checkResponse2 = await fetch(
      `${BASE_URL}/api/webhooks/stripe?organizationId=test&action=check`
    );
    const checkData2 = await checkResponse2.json();
    console.log("📊 Status após simulação:", checkData2);
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testWebhook();
