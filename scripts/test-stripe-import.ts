import { config } from "dotenv";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testStripeImport() {
  console.log("🧪 Testando importação do Stripe...\n");

  try {
    console.log("📦 Importando stripe...");
    const { stripe } = await import("../src/lib/stripe");

    console.log("📋 Stripe importado:", stripe);

    if (stripe) {
      console.log("✅ Stripe configurado corretamente");

      // Testar uma operação simples
      console.log("🧪 Testando operação do Stripe...");
      const account = await stripe.accounts.retrieve();
      console.log("✅ Operação do Stripe funcionando");
    } else {
      console.log("❌ Stripe não configurado");
      console.log("🔍 Verificando variáveis de ambiente...");
      console.log(
        "STRIPE_SECRET_KEY:",
        process.env.STRIPE_SECRET_KEY ? "Configurada" : "NÃO CONFIGURADA"
      );
    }
  } catch (error) {
    console.error("❌ Erro ao importar Stripe:", error);
  }
}

testStripeImport().catch(console.error);
