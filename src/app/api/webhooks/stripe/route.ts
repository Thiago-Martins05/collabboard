import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const action = searchParams.get("action");

    if (action !== "config" && !organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    if (action === "check") {
      // Verifica o status da subscription
      const subscription = await db.subscription.findUnique({
        where: { organizationId: organizationId! },
      });

      const featureLimit = await db.featureLimit.findUnique({
        where: { organizationId: organizationId! },
      });

      return NextResponse.json({
        subscription,
        featureLimit,
        organizationId,
      });
    }

    if (action === "config") {
      // Verifica a configuração do webhook
      return NextResponse.json({
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
          ? "✅ Configurado"
          : "❌ Não configurado",
        stripeSecretKey: process.env.STRIPE_SECRET_KEY
          ? "✅ Configurado"
          : "❌ Não configurado",
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          ? "✅ Configurado"
          : "❌ Não configurado",
        proPriceId: process.env.STRIPE_PRO_PRICE_ID
          ? "✅ Configurado"
          : "❌ Não configurado",
        nextAuthUrl: process.env.NEXTAUTH_URL
          ? "✅ Configurado"
          : "❌ Não configurado",
        stripe: stripe ? "✅ Configurado" : "❌ Não configurado",
      });
    }

    if (action === "revalidate") {
      // Força revalidação do cache
      console.log("🔄 Forçando revalidação para org:", organizationId);

      const subscription = await db.subscription.findUnique({
        where: { organizationId: organizationId! },
      });

      const featureLimit = await db.featureLimit.findUnique({
        where: { organizationId: organizationId! },
      });

      return NextResponse.json({
        success: true,
        message: "Cache revalidado",
        subscription,
        featureLimit,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "test-real-webhook") {
      // Testa se o webhook real está sendo chamado
      console.log("🧪 Testando webhook real para org:", organizationId);

      // Simula um evento real do Stripe
      const realEvent = {
        id: "evt_test_" + Date.now(),
        object: "event",
        api_version: "2025-07-30.basil",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_test_" + Date.now(),
            object: "checkout.session",
            metadata: { organizationId: organizationId! },
            subscription: "sub_test_" + Date.now(),
            customer: "cus_test_" + Date.now(),
            customer_email: "test@example.com",
            payment_status: "paid",
            status: "complete",
          },
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
          id: "req_test_" + Date.now(),
          idempotency_key: null,
        },
        type: "checkout.session.completed",
      };

      // Simula o body e signature do webhook
      const body = JSON.stringify(realEvent);
      const signature =
        "t=" + Math.floor(Date.now() / 1000) + ",v1=fake_signature";

      console.log("📝 Simulando webhook real com body:", body.length, "bytes");
      console.log("🔐 Simulando signature:", signature);

      return NextResponse.json({
        success: true,
        message: "Webhook real simulado",
        event: realEvent,
        bodyLength: body.length,
        signature: signature,
      });
    }

    if (action === "reset-to-free") {
      // Reseta o plano para FREE
      console.log("🔄 Resetando plano para FREE para org:", organizationId);

      try {
        // Atualiza a subscription para FREE
        const subscription = await db.subscription.upsert({
          where: { organizationId: organizationId! },
          update: {
            plan: "FREE",
            status: "FREE",
            stripeSubId: null,
            currentPeriodEnd: null,
          },
          create: {
            organizationId: organizationId!,
            plan: "FREE",
            status: "FREE",
          },
        });

        // Atualiza os limites para FREE
        const featureLimit = await db.featureLimit.upsert({
          where: { organizationId: organizationId! },
          update: {
            maxBoards: 5,
            maxMembers: 5,
          },
          create: {
            organizationId: organizationId!,
            maxBoards: 5,
            maxMembers: 5,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Plano resetado para FREE",
          subscription,
          featureLimit,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Erro ao resetar plano:", error);
        return NextResponse.json(
          { error: "Erro ao resetar plano" },
          { status: 500 }
        );
      }
    }

    if (action === "simulate") {
      // Simula o webhook do Stripe com dados reais
      console.log("🎭 Simulando webhook do Stripe para org:", organizationId);

      // Simula um checkout session completed com dados mais realistas
      const mockSession = {
        id: "cs_test_" + Date.now(),
        object: "checkout.session",
        metadata: { organizationId: organizationId! },
        subscription: "sub_test_" + Date.now(),
        customer: "cus_test_" + Date.now(),
        customer_email: "test@example.com",
        payment_status: "paid",
        status: "complete",
      } as unknown as Stripe.Checkout.Session;

      await handleCheckoutCompleted(mockSession);

      return NextResponse.json({
        success: true,
        message: "Webhook simulado com sucesso",
        sessionId: mockSession.id,
        subscriptionId: mockSession.subscription,
      });
    }

    console.log("🧪 Testando webhook manualmente para org:", organizationId);

    // Simula um checkout session completed
    const mockSession = {
      metadata: { organizationId: organizationId! },
      subscription: "sub_test_" + Date.now(),
    } as unknown as Stripe.Checkout.Session;

    await handleCheckoutCompleted(mockSession);

    return NextResponse.json({
      success: true,
      message: "Webhook testado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro no teste do webhook:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("🔔 Webhook Stripe recebido");
    console.log("📋 Headers:", Object.fromEntries((await headers()).entries()));

    // Verifica se o Stripe está configurado
    if (!stripe) {
      console.error("❌ Stripe não configurado");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = (await headers()).get("stripe-signature")!;

    console.log("📝 Body length:", body.length);
    console.log("🔐 Signature:", signature ? "Presente" : "Ausente");

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("✅ Evento Stripe verificado:", event.type);
      console.log("📋 Event data:", JSON.stringify(event.data, null, 2));
    } catch (err) {
      console.error("❌ Assinatura inválida:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed":
        console.log("🛒 Checkout completado, processando...");
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        console.log("📅 Subscription atualizada, processando...");
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        console.log("🗑️ Subscription deletada, processando...");
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log("ℹ️ Evento não tratado:", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("🔍 Processando checkout completado");
  console.log("📋 Session metadata:", session.metadata);

  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    console.error("❌ organizationId não encontrado no metadata");
    return;
  }

  console.log("🏢 OrganizationId:", organizationId);

  try {
    // Atualiza a subscription para PRO
    const subscription = await db.subscription.upsert({
      where: { organizationId },
      update: {
        plan: "PRO",
        status: "PRO",
        stripeSubId: session.subscription as string,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId,
        plan: "PRO",
        status: "PRO",
        stripeSubId: session.subscription as string,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("✅ Subscription atualizada:", subscription);

    // Atualiza os limites
    const featureLimit = await db.featureLimit.upsert({
      where: { organizationId },
      update: {
        maxBoards: PLANS.PRO.limits.boards,
        maxMembers: PLANS.PRO.limits.members,
      },
      create: {
        organizationId,
        maxBoards: PLANS.PRO.limits.boards,
        maxMembers: PLANS.PRO.limits.members,
      },
    });

    console.log("✅ Feature limits atualizados:", featureLimit);
  } catch (error) {
    console.error("❌ Erro ao processar checkout:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  const status = subscription.status;
  const plan = status === "active" ? "PRO" : "FREE";

  await db.subscription.update({
    where: { organizationId },
    data: {
      plan,
      status: plan,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Atualiza os limites baseados no plano
  const planLimits = PLANS[plan as keyof typeof PLANS].limits;
  await db.featureLimit.update({
    where: { organizationId },
    data: {
      maxBoards: planLimits.boards,
      maxMembers: planLimits.members,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  // Volta para o plano FREE
  await db.subscription.update({
    where: { organizationId },
    data: {
      plan: "FREE",
      status: "FREE",
    },
  });

  // Atualiza os limites para FREE
  await db.featureLimit.update({
    where: { organizationId },
    data: {
      maxBoards: PLANS.FREE.limits.boards,
      maxMembers: PLANS.FREE.limits.members,
    },
  });
}
