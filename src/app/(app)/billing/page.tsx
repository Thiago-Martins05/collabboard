import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { BillingPlans } from "./billing-plans";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Busca a organização do usuário
  const org = await ensureUserPrimaryOrganization();
  if (!org) {
    redirect("/dashboard");
  }

  // Busca a subscription atual
  const subscription = await db.subscription.findUnique({
    where: { organizationId: org.id },
  });

  // Busca estatísticas de uso
  const boards = await db.board.count({ where: { organizationId: org.id } });
  const members = await db.membership.count({
    where: { organizationId: org.id },
  });

  const currentPlan = subscription?.plan || "FREE";
  const isPro = currentPlan === "PRO";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Billing & Planos</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e escolha o plano ideal para sua organização.
        </p>
      </div>

      {/* Status atual */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Plano Atual: {PLANS[currentPlan as keyof typeof PLANS].name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPro ? "Assinatura ativa" : "Plano gratuito"}
            </p>
          </div>
          {isPro && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Próxima cobrança</p>
              <p className="font-medium">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "pt-BR"
                    )
                  : "N/A"}
              </p>
            </div>
          )}
        </div>

        {/* Estatísticas de uso */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Boards</p>
            <p className="text-2xl font-bold">
              {boards} /{" "}
              {PLANS[currentPlan as keyof typeof PLANS].limits.boards === -1
                ? "∞"
                : PLANS[currentPlan as keyof typeof PLANS].limits.boards}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Membros</p>
            <p className="text-2xl font-bold">
              {members} /{" "}
              {PLANS[currentPlan as keyof typeof PLANS].limits.members}
            </p>
          </div>
        </div>
      </div>

      {/* Planos disponíveis */}
      <BillingPlans
        currentPlan={currentPlan}
        organizationId={org.id}
        stripeCustomerId={subscription?.stripeCustomerId}
      />
    </div>
  );
}
