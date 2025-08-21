// Script para testar o fluxo completo de pagamento
// Execute com: node test-real-payment.js

const BASE_URL = "http://localhost:3000";

async function testRealPayment() {
  try {
    console.log("🧪 Testando fluxo completo de pagamento...");

    const organizationId = "cmekp92y700036aus2ehrtz6i";

    // 1. Verificar status inicial
    console.log("\n📋 1. Verificando status inicial...");
    const initialStatus = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=check&organizationId=${organizationId}`
    );
    const initialData = await initialStatus.json();
    console.log("📊 Status inicial:", initialData);

    // 2. Simular webhook real do Stripe
    console.log("\n🎭 2. Simulando webhook real do Stripe...");
    const webhookTest = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=test-real-webhook&organizationId=${organizationId}`
    );
    const webhookData = await webhookTest.json();
    console.log("✅ Webhook simulado:", webhookData);

    // 3. Simular checkout completado
    console.log("\n🛒 3. Simulando checkout completado...");
    const checkoutTest = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=simulate&organizationId=${organizationId}`
    );
    const checkoutData = await checkoutTest.json();
    console.log("✅ Checkout simulado:", checkoutData);

    // 4. Verificar status final
    console.log("\n📋 4. Verificando status final...");
    const finalStatus = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=check&organizationId=${organizationId}`
    );
    const finalData = await finalStatus.json();
    console.log("📊 Status final:", finalData);

    // 5. Forçar revalidação
    console.log("\n🔄 5. Forçando revalidação...");
    const revalidate = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=revalidate&organizationId=${organizationId}`
    );
    const revalidateData = await revalidate.json();
    console.log("✅ Revalidação:", revalidateData);

    // 6. Verificar configuração
    console.log("\n⚙️ 6. Verificando configuração...");
    const config = await fetch(`${BASE_URL}/api/webhooks/stripe?action=config`);
    const configData = await config.json();
    console.log("⚙️ Configuração:", configData);

    console.log("\n🎯 Resumo:");
    console.log("• Status inicial:", initialData.subscription?.plan);
    console.log("• Status final:", finalData.subscription?.plan);
    console.log(
      "• Mudou:",
      initialData.subscription?.plan !== finalData.subscription?.plan
    );
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testRealPayment();
