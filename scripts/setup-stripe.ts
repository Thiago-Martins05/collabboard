import { config } from "dotenv";
import { stripe } from "@/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env.local" });

async function setupStripe() {
  console.log("🔧 Configurando Stripe...\n");

  try {
    if (!stripe) {
      console.log(
        "❌ Stripe não configurado. Verifique as variáveis de ambiente."
      );
      return;
    }

    // Criar produto
    console.log("📦 Criando produto...");
    const product = await stripe.products.create({
      name: "CollabBoard Pro",
      description:
        "Plano Pro para CollabBoard - Boards ilimitados e mais recursos",
    });

    console.log(`✅ Produto criado: ${product.id}`);

    // Criar preço
    console.log("💰 Criando preço...");
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2900, // R$ 29.00 em centavos
      currency: "brl",
      recurring: {
        interval: "month",
      },
    });

    console.log(`✅ Preço criado: ${price.id}`);

    console.log("\n🎯 Configuração completa!");
    console.log(`📦 Produto ID: ${product.id}`);
    console.log(`💰 Preço ID: ${price.id}`);

    console.log("\n📋 Adicione ao seu .env.local:");
    console.log(`STRIPE_PRO_PRICE_ID=${price.id}`);
  } catch (error) {
    console.error("❌ Erro ao configurar Stripe:", error);
  }
}

setupStripe().catch(console.error);
