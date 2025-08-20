import { config } from "dotenv";

// Carrega as variáveis de ambiente como o Next.js faz
config({ path: ".env" });

// Simula o carregamento do módulo Stripe após as variáveis estarem carregadas
async function testStripeInNextJS() {
  console.log("🔧 Testando Stripe no contexto Next.js...\n");

  try {
    // Importa o Stripe após carregar as variáveis
    const { stripe } = await import("../src/lib/stripe");

    if (!stripe) {
      console.log("❌ Stripe não está inicializado");
      console.log("Verifique se as variáveis de ambiente estão configuradas");
      return;
    }

    console.log("✅ Stripe está inicializado");

    // Testar uma operação simples
    console.log("🧪 Testando operação do Stripe...");
    const account = await stripe.accounts.retrieve();
    console.log("✅ Operação do Stripe funcionando");
  } catch (error) {
    console.error("❌ Erro na configuração do Stripe:", error);
  }
}

testStripeInNextJS().catch(console.error);
