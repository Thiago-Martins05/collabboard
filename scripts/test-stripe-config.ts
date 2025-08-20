import { config } from "dotenv";
import { stripe } from "@/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testStripeConfig() {
  console.log("🔧 Testando configuração do Stripe na aplicação...\n");

  try {
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

testStripeConfig().catch(console.error);
