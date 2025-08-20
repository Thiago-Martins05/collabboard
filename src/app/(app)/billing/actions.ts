"use server";

import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

export async function createCheckoutSession(
  organizationId: string,
  plan: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("🔧 Iniciando createCheckoutSession:", {
      organizationId,
      plan,
    });

    // Verifica se o Stripe está configurado
    if (!stripe) {
      console.error("❌ Stripe não configurado");
      return {
        error:
          "Stripe não configurado. Configure as variáveis de ambiente do Stripe.",
      };
    }

    console.log("✅ Stripe configurado");

    // Verifica se o usuário tem acesso à organização
    console.log("🔍 Verificando membership...");
    await requireMembership(organizationId);
    console.log("✅ Membership verificado");

    // Busca a organização
    console.log("🏢 Buscando organização...");
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      console.error("❌ Organização não encontrada");
      return { error: "Organização não encontrada" };
    }

    console.log(`✅ Organização encontrada: ${organization.name}`);

    // Se for "manage", redireciona para o portal do cliente
    if (plan === "manage") {
      if (!organization.subscription?.stripeCustomerId) {
        return { error: "Nenhuma assinatura encontrada" };
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.subscription.stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL}/billing`,
      });

      return { url: session.url };
    }

    // Busca ou cria o customer no Stripe
    let customerId = organization.subscription?.stripeCustomerId;

    if (!customerId) {
      const session = await getSession();
      const customer = await stripe.customers.create({
        email: session?.user?.email || "test@example.com",
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
      success_url: `http://localhost:3000/billing?success=true`,
      cancel_url: `http://localhost:3000/billing?canceled=true`,
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
    console.error("Erro ao criar checkout session:", error);
    return { error: "Erro interno do servidor" };
  }
}

// Mock function para simular webhook (para desenvolvimento)
export async function mockWebhookSuccess(organizationId: string) {
  try {
    // Atualiza a subscription para PRO
    await db.subscription.upsert({
      where: { organizationId },
      update: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      create: {
        organizationId,
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Atualiza os limites da organização
    await db.featureLimit.upsert({
      where: { organizationId },
      update: {
        maxBoards: -1, // Ilimitado
        maxMembers: 50,
      },
      create: {
        organizationId,
        maxBoards: -1,
        maxMembers: 50,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao simular webhook:", error);
    return { error: "Erro interno" };
  }
}
