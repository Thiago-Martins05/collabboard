import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    // Verifica se o Stripe está configurado
    if (!stripe) {
      console.error("Stripe não configurado");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const signature = headers().get("stripe-signature")!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const session = event.data.object as any;

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(session);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const organizationId = session.metadata?.organizationId;
  if (!organizationId) return;

  // Atualiza a subscription para PRO
  await db.subscription.upsert({
    where: { organizationId },
    update: {
      plan: "PRO",
      status: "PRO",
      stripeSubId: session.subscription,
      currentPeriodEnd: new Date(session.subscription_data?.trial_end * 1000),
    },
    create: {
      organizationId,
      plan: "PRO",
      status: "PRO",
      stripeSubId: session.subscription,
      currentPeriodEnd: new Date(session.subscription_data?.trial_end * 1000),
    },
  });

  // Atualiza os limites
  await db.featureLimit.upsert({
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
}

async function handleSubscriptionUpdated(subscription: any) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  const status = subscription.status;
  const plan = status === "active" ? "PRO" : "FREE";

  await db.subscription.update({
    where: { organizationId },
    data: {
      plan,
      status: plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
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

async function handleSubscriptionDeleted(subscription: any) {
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
