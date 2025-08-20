import { config } from "dotenv";
import Stripe from "stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testStripeDirect() {
  console.log("🧪 Testando Stripe diretamente...\n");

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!secretKey) {
    console.log("❌ STRIPE_SECRET_KEY não configurada");
    return;
  }

  if (!priceId) {
    console.log("❌ STRIPE_PRO_PRICE_ID não configurada");
    return;
  }

  console.log("✅ Chaves configuradas");
  console.log("💰 Price ID:", priceId);

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-07-30.basil",
  });

  try {
    // Criar customer
    console.log("👤 Criando customer...");
    const customer = await stripe.customers.create({
      email: "test@example.com",
      metadata: {
        organizationId: "test-org-id",
      },
    });

    console.log(`✅ Customer criado: ${customer.id}`);

    // Criar sessão de checkout
    console.log("🛒 Criando sessão de checkout...");
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "http://localhost:3000/billing?success=true",
      cancel_url: "http://localhost:3000/billing?canceled=true",
      metadata: {
        organizationId: "test-org-id",
      },
      subscription_data: {
        metadata: {
          organizationId: "test-org-id",
        },
      },
    });

    console.log(`✅ Sessão criada: ${session.id}`);
    console.log(`🔗 URL do checkout: ${session.url}`);

    if (session.url) {
      console.log("\n🎉 Teste bem-sucedido! O Stripe está funcionando.");
      console.log("Você pode acessar o checkout em:", session.url);
    }
  } catch (error) {
    console.error("❌ Erro ao testar Stripe:", error);
  }
}

testStripeDirect().catch(console.error);
