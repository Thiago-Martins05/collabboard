"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

export async function createCheckoutSession(formData: FormData) {
  try {
    console.log("🛒 Criando sessão de checkout...");

    // Verifica se o Stripe está configurado
    if (!stripe) {
      console.error("❌ Stripe não configurado");
      return { error: "Stripe não configurado" };
    }

    // Verifica se o usuário tem membership
    const userSession = await getSession();
    if (!userSession?.user?.email) {
      console.error("❌ Usuário não autenticado");
      return { error: "Usuário não autenticado" };
    }

    console.log("👤 Usuário:", userSession.user.email);

    // Busca a organização do usuário
    const org = await ensureUserPrimaryOrganization();
    if (!org) {
      console.error("❌ Organização não encontrada");
      return { error: "Organização não encontrada" };
    }

    console.log("🏢 Organização:", org.id, org.name);

    // Busca ou cria a subscription
    let subscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    if (!subscription) {
      console.log("📝 Criando nova subscription FREE");
      subscription = await db.subscription.create({
        data: {
          organizationId: org.id,
          status: "FREE",
          plan: "FREE",
        },
      });
    } else {
      console.log("📋 Subscription existente:", subscription.plan);
    }

    console.log("🔑 STRIPE_PRO_PRICE_ID:", process.env.STRIPE_PRO_PRICE_ID);
    console.log("🌐 NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

    // Cria a sessão de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userSession.user.email || undefined,
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
        organizationId: org.id,
      },
    });

    console.log("✅ Sessão de checkout criada:", checkoutSession.id);
    console.log("🔗 URL de checkout:", checkoutSession.url);

    return { url: checkoutSession.url };
  } catch (error) {
    console.error("❌ Erro ao criar sessão de checkout:", error);
    return { error: "Erro ao criar sessão de checkout" };
  }
}

export async function mockWebhookSuccess(organizationId: string) {
  try {
    // Atualiza a subscription para PRO
    await db.subscription.upsert({
      where: { organizationId },
      update: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        maxBoards: -1,
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
    return { error: "Erro interno" };
  }
}

export async function processUpgradeAfterCheckout() {
  try {
    const organizations = await db.organization.findMany({
      where: {
        subscription: {
          AND: [
            { plan: "FREE" },
            {
              OR: [
                { stripeCustomerId: { not: null } },
                { stripeSubId: { not: null } },
              ],
            },
          ],
        },
      },
      include: {
        subscription: true,
      },
    });

    if (organizations.length === 0) {
      return { success: true, message: "Nenhum upgrade pendente" };
    }

    for (const organization of organizations) {
      await db.subscription.update({
        where: { organizationId: organization.id },
        data: {
          plan: "PRO",
          status: "PRO",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await db.featureLimit.upsert({
        where: { organizationId: organization.id },
        update: {
          maxBoards: -1,
          maxMembers: 50,
        },
        create: {
          organizationId: organization.id,
          maxBoards: -1,
          maxMembers: 50,
        },
      });
    }

    return {
      success: true,
      message: `${organizations.length} organização(s) atualizada(s)`,
    };
  } catch (error) {
    return { error: "Erro interno do servidor" };
  }
}

export async function forceUpgradeToPro() {
  try {
    console.log("🚀 Forçando upgrade para PRO...");

    const userSession = await getSession();
    if (!userSession?.user?.email) {
      return { error: "Usuário não autenticado" };
    }

    const org = await ensureUserPrimaryOrganization();
    if (!org) {
      return { error: "Organização não encontrada" };
    }

    console.log("🏢 Atualizando organização:", org.id);

    // Força a atualização para PRO
    const subscription = await db.subscription.upsert({
      where: { organizationId: org.id },
      update: {
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId: org.id,
        plan: "PRO",
        status: "PRO",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Atualiza os limites
    const featureLimit = await db.featureLimit.upsert({
      where: { organizationId: org.id },
      update: {
        maxBoards: -1,
        maxMembers: 50,
      },
      create: {
        organizationId: org.id,
        maxBoards: -1,
        maxMembers: 50,
      },
    });

    console.log("✅ Upgrade forçado realizado:", {
      subscription,
      featureLimit,
    });

    return { success: true, subscription, featureLimit };
  } catch (error) {
    console.error("❌ Erro ao forçar upgrade:", error);
    return { error: "Erro ao forçar upgrade" };
  }
}
