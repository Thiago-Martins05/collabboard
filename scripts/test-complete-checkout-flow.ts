import { config } from "dotenv";
import { db } from "../src/lib/db";
import { stripe } from "../src/lib/stripe";
import { PLANS } from "../src/lib/stripe";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function testCompleteCheckoutFlow() {
  console.log("🧪 Testando fluxo completo de checkout...\n");

  try {
    // 1. Buscar uma organização para testar
    const organization = await db.organization.findFirst({
      include: {
        subscription: true,
      },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    const featureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    if (!organization) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    console.log("🏢 Organização:", organization.name);
    console.log("📊 Status inicial:");
    console.log(`   Plano: ${organization.subscription?.plan || "FREE"}`);
    console.log(`   Status: ${organization.subscription?.status || "FREE"}`);
    console.log(
      `   Customer ID: ${
        organization.subscription?.stripeCustomerId || "Nenhum"
      }`
    );
    console.log(`   Limites - Boards: ${featureLimit?.maxBoards || 5}`);
    console.log(`   Limites - Members: ${featureLimit?.maxMembers || 5}`);

    // 2. Verificar se o Stripe está configurado
    if (!stripe) {
      console.log("❌ Stripe não configurado");
      return;
    }

    console.log("✅ Stripe configurado");

    // 3. Criar ou buscar customer ID
    let customerId = organization.subscription?.stripeCustomerId;

    if (!customerId) {
      console.log("🆕 Criando customer no Stripe...");
      const customer = await stripe.customers.create({
        email: "test@example.com",
        metadata: {
          organizationId: organization.id,
        },
      });
      customerId = customer.id;

      // Salvar customer ID no banco
      await db.subscription.upsert({
        where: { organizationId: organization.id },
        update: { stripeCustomerId: customerId },
        create: {
          organizationId: organization.id,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "FREE",
        },
      });

      console.log(`✅ Customer criado: ${customerId}`);
    } else {
      console.log(`✅ Customer existente: ${customerId}`);
    }

    // 4. Criar sessão de checkout
    console.log("\n🛒 Criando sessão de checkout...");

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
        organizationId: organization.id,
      },
      subscription_data: {
        metadata: {
          organizationId: organization.id,
        },
      },
    });

    console.log(`✅ Sessão criada: ${session.id}`);
    console.log(`🔗 URL: ${session.url}`);

    // 5. Simular webhook (em desenvolvimento)
    console.log("\n📡 Simulando webhook: checkout.session.completed");

    // Atualizar subscription para PRO
    await db.subscription.update({
      where: { organizationId: organization.id },
      data: {
        plan: "PRO",
        status: "PRO",
        stripeSubId: session.subscription as string,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    console.log("✅ Subscription atualizada para PRO");

    // Atualizar feature limits
    await db.featureLimit.upsert({
      where: { organizationId: organization.id },
      update: {
        maxBoards: PLANS.PRO.limits.boards,
        maxMembers: PLANS.PRO.limits.members,
      },
      create: {
        organizationId: organization.id,
        maxBoards: PLANS.PRO.limits.boards,
        maxMembers: PLANS.PRO.limits.members,
      },
    });

    console.log("✅ Feature limits atualizados");

    // 6. Verificar resultado final
    const updatedOrg = await db.organization.findUnique({
      where: { id: organization.id },
      include: {
        subscription: true,
      },
    });

    const updatedFeatureLimit = await db.featureLimit.findUnique({
      where: { organizationId: organization.id },
    });

    console.log("\n📊 Status final:");
    console.log(`   Plano: ${updatedOrg?.subscription?.plan}`);
    console.log(`   Status: ${updatedOrg?.subscription?.status}`);
    console.log(
      `   Customer ID: ${updatedOrg?.subscription?.stripeCustomerId}`
    );
    console.log(`   Subscription ID: ${updatedOrg?.subscription?.stripeSubId}`);
    console.log(
      `   Próxima cobrança: ${updatedOrg?.subscription?.currentPeriodEnd?.toLocaleDateString(
        "pt-BR"
      )}`
    );
    console.log(
      `   Limites - Boards: ${
        updatedFeatureLimit?.maxBoards === -1
          ? "Ilimitado"
          : updatedFeatureLimit?.maxBoards
      }`
    );
    console.log(`   Limites - Members: ${updatedFeatureLimit?.maxMembers}`);

    console.log("\n🎉 Fluxo de checkout testado com sucesso!");
    console.log("\n🔗 Para testar na interface:");
    console.log("1. Acesse: http://localhost:3000/billing");
    console.log("2. Você deve ver o plano PRO ativo");
    console.log("3. Teste criar boards e membros além dos limites FREE");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testCompleteCheckoutFlow().catch(console.error);
