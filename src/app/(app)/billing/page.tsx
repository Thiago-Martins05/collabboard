import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";
import { ensureOwnerMembership } from "@/lib/rbac";
import { getOrganizationUsage } from "@/lib/limits";
import { BillingPlans } from "./billing-plans";
import { CreditCard, CheckCircle, TrendingUp } from "lucide-react";
import Image from "next/image";
// import { ForceUpgradeButton } from "./force-upgrade-button";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user?.email) return null;

  console.log("🔍 Billing page - searchParams:", sp);
  console.log("👤 Usuário:", session.user.email);

  // 🔹 Auto-provisiona org pessoal e garante membership OWNER
  const org = await ensureUserPrimaryOrganization();
  if (org?.id) {
    await ensureOwnerMembership(org.id);
  }

  console.log("🏢 Organização:", org?.id, org?.name);

  // Obtém estatísticas de uso da organização
  const usage = org?.id ? await getOrganizationUsage(org.id) : null;

  // Obtém o plano atual da subscription
  const subscription = org?.id
    ? await db.subscription.findUnique({
        where: { organizationId: org.id },
      })
    : null;
  const currentPlan = subscription?.plan || "FREE";

  console.log("📋 Subscription:", subscription);
  console.log("🎯 Plano atual:", currentPlan);
  console.log("🔄 Timestamp:", new Date().toISOString());

  // Força upgrade para PRO se success=true e plano atual é FREE
  if (sp?.success && currentPlan === "FREE" && org?.id) {
    console.log("✅ Success parameter detected, forcing upgrade to PRO");

    try {
      // Atualiza a subscription para PRO
      const updatedSubscription = await db.subscription.upsert({
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

      // Atualiza os limites para PRO
      await db.featureLimit.upsert({
        where: { organizationId: org.id },
        update: {
          maxBoards: -1, // Ilimitado
          maxMembers: 50,
        },
        create: {
          organizationId: org.id,
          maxBoards: -1, // Ilimitado
          maxMembers: 50,
        },
      });

      console.log("✅ Upgrade forçado realizado:", updatedSubscription);

      // Atualiza a variável currentPlan para refletir a mudança
      const newSubscription = await db.subscription.findUnique({
        where: { organizationId: org.id },
      });
      const newCurrentPlan = newSubscription?.plan || "FREE";
      console.log("🎯 Novo plano atual:", newCurrentPlan);
    } catch (error) {
      console.error("❌ Erro ao forçar upgrade:", error);
    }
  }

  // Debug adicional
  console.log("🔍 Debug adicional:");
  console.log("  - searchParams:", sp);
  console.log("  - organizationId:", org?.id);
  console.log("  - subscription.plan:", subscription?.plan);
  console.log("  - subscription.status:", subscription?.status);
  console.log("  - currentPlan:", currentPlan);
  console.log("  - success param:", sp?.success);

  // Obtém o plano atualizado após possível upgrade
  const finalSubscription = org?.id
    ? await db.subscription.findUnique({
        where: { organizationId: org.id },
      })
    : null;
  const finalCurrentPlan = finalSubscription?.plan || "FREE";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative w-12 h-12">
            <Image
              src="/collabboard-logo.png"
              alt="CollabBoard Logo"
              width={48}
              height={48}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
            Billing & Planos
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Gerencie sua assinatura e planos
        </p>
      </div>

      {/* Mensagem de sucesso após checkout */}
      {sp?.success && (
        <div className="rounded-2xl border border-green-200/50 bg-green-50/50 dark:bg-green-950/20 p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
                Pagamento processado com sucesso!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                Sua assinatura foi ativada e você agora tem acesso a todos os
                recursos do plano Pro. Obrigado por escolher o CollabBoard!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status atual */}
      <div className="rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Status atual</h3>
            <p className="text-sm text-muted-foreground">
              Plano ativo e estatísticas de uso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plano atual */}
          <div className="rounded-xl bg-muted/50 p-4 border border-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-muted-foreground font-medium">
                Plano Atual
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {finalCurrentPlan === "PRO" ? "Pro" : "Free"}
            </p>
          </div>

          {/* Estatísticas de uso */}
          {usage && (
            <>
              <div className="rounded-xl bg-muted/50 p-4 border border-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-4 h-4">
                    <Image
                      src="/collabboard-logo.png"
                      alt="CollabBoard Logo"
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Boards
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.boards.current} /{" "}
                  {usage.boards.max < 0 ? "∞" : usage.boards.max}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-4 border border-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-4 h-4">
                    <Image
                      src="/collabboard-logo.png"
                      alt="CollabBoard Logo"
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Membros
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {usage.members.current} /{" "}
                  {usage.members.max < 0 ? "∞" : usage.members.max}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Planos */}
      <BillingPlans
        currentPlan={finalCurrentPlan}
        organizationId={org?.id || ""}
        stripeCustomerId={subscription?.stripeCustomerId || null}
      />

      {/* Botão de teste para desenvolvimento */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            🧪 Teste de Desenvolvimento
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Use este botão para testar o upgrade para PRO sem pagamento
          </p>
          <ForceUpgradeButton organizationId={org?.id || ""} />
        </div>
      )} */}
    </div>
  );
}
