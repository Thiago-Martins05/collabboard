// Script para testar o upgrade automático quando success=true
// Execute com: node test-success-upgrade.js

const BASE_URL = "http://localhost:3000";

async function testSuccessUpgrade() {
  try {
    console.log("🧪 Testando upgrade automático quando success=true...");

    const organizationId = "cmekp92y700036aus2ehrtz6i";

    // 1. Primeiro, vamos voltar o plano para FREE
    console.log("\n📋 1. Voltando plano para FREE...");
    const resetResponse = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=reset-to-free&organizationId=${organizationId}`
    );
    const resetData = await resetResponse.json();
    console.log("✅ Reset realizado:", resetData);

    // 2. Verificar status após reset
    console.log("\n📋 2. Verificando status após reset...");
    const statusAfterReset = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=check&organizationId=${organizationId}`
    );
    const statusData = await statusAfterReset.json();
    console.log("📊 Status após reset:", statusData);

    // 3. Simular acesso à página com success=true
    console.log("\n🎭 3. Simulando acesso à página com success=true...");
    console.log("🔗 URL: http://localhost:3000/billing?success=true");
    console.log(
      "📝 Acesse esta URL no navegador para testar o upgrade automático"
    );

    // 4. Verificar status após simulação
    console.log("\n📋 4. Verificando status após simulação...");
    const finalStatus = await fetch(
      `${BASE_URL}/api/webhooks/stripe?action=check&organizationId=${organizationId}`
    );
    const finalData = await finalStatus.json();
    console.log("📊 Status final:", finalData);

    console.log("\n🎯 Resumo:");
    console.log("• Plano após reset:", statusData.subscription?.plan);
    console.log("• Plano final:", finalData.subscription?.plan);
    console.log(
      "• Mudou:",
      statusData.subscription?.plan !== finalData.subscription?.plan
    );

    console.log("\n📝 Para testar manualmente:");
    console.log("1. Acesse: http://localhost:3000/billing?success=true");
    console.log("2. Verifique se o plano mudou de 'Free' para 'Pro'");
    console.log("3. Verifique se a mensagem de sucesso aparece");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testSuccessUpgrade();
