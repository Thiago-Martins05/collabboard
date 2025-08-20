import { config } from "dotenv";
import Stripe from "stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function checkWebhookConfig() {
  console.log("🔍 Verificando configuração do webhook...\n");

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    console.log("❌ STRIPE_SECRET_KEY não configurada");
    return;
  }

  if (!webhookSecret) {
    console.log("❌ STRIPE_WEBHOOK_SECRET não configurada");
    console.log("💡 Configure o webhook no painel do Stripe:");
    console.log("1. Acesse: https://dashboard.stripe.com/webhooks");
    console.log("2. Clique em 'Add endpoint'");
    console.log("3. URL: http://localhost:3000/api/webhooks/stripe");
    console.log(
      "4. Eventos: checkout.session.completed, customer.subscription.*"
    );
    console.log("5. Copie o webhook secret e adicione ao .env");
    return;
  }

  console.log("✅ Webhook secret configurada");

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-07-30.basil",
  });

  try {
    // Listar webhooks configurados
    console.log("📋 Webhooks configurados:");
    const webhooks = await stripe.webhookEndpoints.list();

    if (webhooks.data.length === 0) {
      console.log("❌ Nenhum webhook configurado");
      console.log("💡 Configure o webhook no painel do Stripe:");
      console.log("1. Acesse: https://dashboard.stripe.com/webhooks");
      console.log("2. Clique em 'Add endpoint'");
      console.log("3. URL: http://localhost:3000/api/webhooks/stripe");
      console.log(
        "4. Eventos: checkout.session.completed, customer.subscription.*"
      );
      console.log("5. Copie o webhook secret e adicione ao .env");
    } else {
      webhooks.data.forEach((webhook, index) => {
        console.log(`${index + 1}. ${webhook.url}`);
        console.log(`   Status: ${webhook.status}`);
        console.log(`   Eventos: ${webhook.enabled_events.join(", ")}`);
        console.log("");
      });
    }

    console.log("📝 Para desenvolvimento local:");
    console.log("1. Use o Stripe CLI para encaminhar webhooks:");
    console.log(
      "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
    );
    console.log("2. Ou configure um webhook público (ngrok):");
    console.log("   ngrok http 3000");
    console.log("3. Use a URL do ngrok no webhook do Stripe");
  } catch (error) {
    console.error("❌ Erro ao verificar webhooks:", error);
  }
}

checkWebhookConfig().catch(console.error);
