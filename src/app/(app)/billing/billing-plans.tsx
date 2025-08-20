"use client";

import { useState } from "react";
import { Check, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/stripe";
import { createCheckoutSession } from "./actions";
import { toast } from "sonner";

interface BillingPlansProps {
  currentPlan: string;
  organizationId: string;
  stripeCustomerId?: string | null;
}

export function BillingPlans({
  currentPlan,
  organizationId,
  stripeCustomerId,
}: BillingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (plan === currentPlan) return;

    console.log("🔧 Iniciando upgrade para:", plan);
    console.log("📋 Dados:", { organizationId, currentPlan, plan });

    setIsLoading(plan);
    try {
      console.log("🔄 Chamando createCheckoutSession...");
      const { url, error } = await createCheckoutSession(organizationId, plan);

      console.log("📤 Resposta:", { url, error });

      if (error) {
        console.error("❌ Erro retornado:", error);
        toast.error(error);
        return;
      }
      if (url) {
        console.log("✅ Redirecionando para:", url);
        window.location.href = url;
      } else {
        console.error("❌ Nenhuma URL retornada");
        toast.error("Erro: nenhuma URL de checkout foi gerada");
      }
    } catch (error) {
      console.error("❌ Erro ao criar checkout session:", error);
      toast.error("Erro ao criar sessão de checkout");
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading("manage");
    try {
      const { url, error } = await createCheckoutSession(
        organizationId,
        "manage"
      );
      if (error) {
        toast.error(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast.error("Erro ao acessar portal do cliente");
      console.error("Portal error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Comece grátis e faça upgrade quando precisar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plano Free */}
        <Card className="relative">
          {currentPlan === "FREE" && (
            <Badge className="absolute -top-2 left-4 bg-green-600">Atual</Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Free
            </CardTitle>
            <CardDescription>
              Perfeito para começar e testar a plataforma
            </CardDescription>
            <div className="text-3xl font-bold">
              R$ 0
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>5 boards</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>5 membros</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>10 colunas por board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>100 cards por board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>20 labels por board</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Plano Atual
            </Button>
          </CardContent>
        </Card>

        {/* Plano Pro */}
        <Card className="relative border-2 border-primary">
          {currentPlan === "PRO" && (
            <Badge className="absolute -top-2 left-4 bg-primary">Atual</Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Pro
            </CardTitle>
            <CardDescription>
              Para equipes que precisam de mais recursos
            </CardDescription>
            <div className="text-3xl font-bold">
              R$ 29
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Boards ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>50 membros</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>50 colunas por board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>1000 cards por board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>100 labels por board</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            {currentPlan === "PRO" ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading === "manage"}
                className="w-full"
              >
                {isLoading === "manage"
                  ? "Carregando..."
                  : "Gerenciar Assinatura"}
              </Button>
            ) : (
              <Button
                onClick={() => handleUpgrade("PRO")}
                disabled={isLoading === "PRO"}
                className="w-full"
              >
                {isLoading === "PRO" ? "Carregando..." : "Fazer Upgrade"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Todos os planos incluem 7 dias de teste gratuito. Cancele a qualquer
          momento.
        </p>
      </div>
    </div>
  );
}
