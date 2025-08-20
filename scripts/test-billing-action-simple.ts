import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

// Configuração direta do Stripe para o teste
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

async function testBillingActionSimple() {
  console.log("🧪 Testando billing action (versão simplificada)...\n");

  try {
    // Buscar uma organização existente
    const organization = await db.organization.findFirst({
      include: {
        subscription: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização:", organization.name);
    console.log("👥 Membros:", organization.memberships.length);

    if (organization.memberships.length === 0) {
      console.log("❌ Nenhum membro na organização");
      return;
    }

    const organizationId = organization.id;
    const plan = "PRO";

    console.log("🔧 Iniciando createCheckoutSession:", {
      organizationId,
      plan,
    });

    // Verifica se o Stripe está configurado
    if (!stripe) {
      console.error("❌ Stripe não configurado");
      return;
    }

    console.log("✅ Stripe configurado");

    // Busca a organização
    console.log("🏢 Buscando organização...");
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!org) {
      console.error("❌ Organização não encontrada");
      return;
    }

    console.log(`✅ Organização encontrada: ${org.name}`);

    // Busca ou cria o customer no Stripe
    let customerId = org.subscription?.stripeCustomerId;

    if (!customerId) {
      console.log("👤 Criando customer no Stripe...");
      const customer = await stripe.customers.create({
        email: "test@example.com",
        metadata: {
          organizationId,
        },
      });
      customerId = customer.id;

      // Salva o customer ID no banco
      await db.subscription.upsert({
        where: { organizationId },
        update: { stripeCustomerId: customerId },
        create: {
          organizationId,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "FREE",
        },
      });
      console.log(`✅ Customer criado: ${customerId}`);
    } else {
      console.log(`✅ Customer existente: ${customerId}`);
    }

    // Cria a sessão de checkout
    console.log("🛒 Criando sessão de checkout...");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
      metadata: {
        organizationId,
      },
      subscription_data: {
        metadata: {
          organizationId,
        },
      },
    });

    console.log(`✅ Sessão criada: ${session.id}`);
    console.log(`🔗 URL: ${session.url}`);

    return { url: session.url };
  } catch (error) {
    console.error("❌ Erro ao criar checkout session:", error);
    return { error: "Erro interno do servidor" };
  }
}

testBillingActionSimple().catch(console.error);
