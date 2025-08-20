"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { withRbacGuard, requireMembership } from "@/lib/rbac-guard";

export async function createCheckoutSession(formData: FormData) {
  try {
    // Verifica se o Stripe está configurado
    if (!stripe) {
      return { error: "Stripe não configurado" };
    }

    // Verifica se o usuário tem membership
    const userSession = await getSession();
    if (!userSession?.user?.email) {
      return { error: "Usuário não autenticado" };
    }

    // Busca a organização do usuário
    const org = await ensureUserPrimaryOrganization();
    if (!org) {
      return { error: "Organização não encontrada" };
    }

    // Busca ou cria a subscription
    let subscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          organizationId: org.id,
          status: "FREE",
          plan: "FREE",
        },
      });
    }

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

    return { url: checkoutSession.url };
  } catch (error) {
    return { error: "Erro ao criar sessão de checkout" };
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
    return { error: "Erro interno" };
  }
}

// Action para processar upgrade automático após checkout
export async function processUpgradeAfterCheckout() {
  try {
    console.log("🔄 DEBUG - processUpgradeAfterCheckout iniciado");

    // Buscar organizações FREE que têm customer ID OU subscription ID (fizeram checkout)
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

    console.log("🔍 DEBUG - Organizações encontradas:", organizations.length);
    console.log(
      "🔍 DEBUG - Organizações:",
      organizations.map((org) => ({
        id: org.id,
        subscription: org.subscription,
      }))
    );

    if (organizations.length === 0) {
      console.log("⚠️ DEBUG - Nenhum upgrade pendente");
      return { success: true, message: "Nenhum upgrade pendente" };
    }

    for (const organization of organizations) {
      console.log(`🔄 DEBUG - Processando organização: ${organization.id}`);

      // Atualizar subscription para PRO
      await db.subscription.update({
        where: { organizationId: organization.id },
        data: {
          plan: "PRO",
          status: "PRO",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });

      console.log(
        `✅ DEBUG - Subscription atualizada para PRO: ${organization.id}`
      );

      // Atualizar feature limits
      await db.featureLimit.upsert({
        where: { organizationId: organization.id },
        update: {
          maxBoards: -1, // Ilimitado
          maxMembers: 50,
        },
        create: {
          organizationId: organization.id,
          maxBoards: -1,
          maxMembers: 50,
        },
      });

      console.log(`✅ DEBUG - Feature limits atualizados: ${organization.id}`);
    }

    console.log(
      `🎉 DEBUG - Processamento concluído: ${organizations.length} organização(s) atualizada(s)`
    );
    return {
      success: true,
      message: `${organizations.length} organização(s) atualizada(s)`,
    };
  } catch (error) {
    console.error("❌ DEBUG - Erro no processUpgradeAfterCheckout:", error);
    return { error: "Erro interno do servidor" };
  }
}
