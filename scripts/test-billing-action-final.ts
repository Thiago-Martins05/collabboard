import { config } from "dotenv";
import { db } from "../src/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

// Configuração direta do Stripe para o teste
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Simular a configuração dos planos
const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    limits: {
      boards: 5,
      members: 5,
      columns: 10,
      cards: 100,
      labels: 20,
    },
  },
  PRO: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      boards: -1, // Ilimitado
      members: 50,
      columns: 50,
      cards: 1000,
      labels: 100,
    },
  },
} as const;

async function testBillingActionFinal() {
  console.log("🧪 Teste final da action de billing...\n");

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

    // Se for "manage", redireciona para o portal do cliente
    if (plan === "manage") {
      if (!org.subscription?.stripeCustomerId) {
        return { error: "Nenhuma assinatura encontrada" };
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: org.subscription.stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL}/billing`,
      });

      return { url: session.url };
    }

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
    console.log("📋 Dados:", {
      customerId,
      priceId: PLANS.PRO.priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: PLANS.PRO.priceId,
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

    console.log("\n🎉 SUCESSO! O checkout está funcionando!");
    console.log("🔗 URL do checkout:", session.url);
    console.log("\n📝 Para testar na aplicação web:");
    console.log("1. Acesse http://localhost:3000/billing");
    console.log("2. Clique no botão 'Fazer Upgrade'");
    console.log("3. O checkout deve abrir automaticamente");

    return { url: session.url };
  } catch (error) {
    console.error("❌ Erro ao criar checkout session:", error);
    return { error: "Erro interno do servidor" };
  }
}

testBillingActionFinal().catch(console.error);
