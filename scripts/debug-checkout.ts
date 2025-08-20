import { config } from "dotenv";
import { db } from "@/lib/db";

// Carrega as variáveis de ambiente
config({ path: ".env" });

async function debugCheckout() {
  console.log("🔍 Debugando checkout do Stripe...\n");

  try {
    // Verifica se existe uma organização
    console.log("1. Verificando organizações...");
    const orgs = await db.organization.findMany();
    console.log(`   Encontradas ${orgs.length} organizações`);

    if (orgs.length === 0) {
      console.log("❌ Nenhuma organização encontrada");
      return;
    }

    const org = orgs[0];
    console.log(`   Usando organização: ${org.name} (${org.id})`);

    // Verifica subscription
    console.log("\n2. Verificando subscription...");
    const subscription = await db.subscription.findUnique({
      where: { organizationId: org.id },
    });

    if (subscription) {
      console.log(`   Subscription encontrada: ${subscription.plan}`);
    } else {
      console.log("   Nenhuma subscription encontrada");
    }

    // Verifica variáveis de ambiente
    console.log("\n3. Verificando variáveis de ambiente...");
    console.log(
      `   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? "✅" : "❌"}`
    );
    console.log(
      `   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅" : "❌"
      }`
    );
    console.log(
      `   STRIPE_PRO_PRICE_ID: ${process.env.STRIPE_PRO_PRICE_ID ? "✅" : "❌"}`
    );
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);

    // Testa a inicialização do Stripe
    console.log("\n4. Testando inicialização do Stripe...");
    const { stripe } = await import("../src/lib/stripe");

    if (!stripe) {
      console.log("❌ Stripe não inicializado");
    } else {
      console.log("✅ Stripe inicializado");

      // Testa criação de customer
      console.log("\n5. Testando criação de customer...");
      const customer = await stripe.customers.create({
        email: "test@example.com",
        metadata: { organizationId: org.id },
      });
      console.log(`   Customer criado: ${customer.id}`);

      // Testa criação de sessão
      console.log("\n6. Testando criação de sessão...");
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [
          {
            price: process.env.STRIPE_PRO_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
        metadata: { organizationId: org.id },
      });

      console.log(`   Sessão criada: ${session.id}`);
      console.log(`   URL: ${session.url}`);
    }
  } catch (error) {
    console.error("❌ Erro durante debug:", error);
  } finally {
    await db.$disconnect();
  }
}

debugCheckout().catch(console.error);
