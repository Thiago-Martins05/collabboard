"use client";

import { useState } from "react";
import { Check, Crown, Zap, Sparkles, Star } from "lucide-react";
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

    setIsLoading(plan);
    try {
      const formData = new FormData();
      formData.append("plan", plan);

      const { url, error } = await createCheckoutSession(formData);

      if (error) {
        toast.error(error);
        return;
      }

      if (url) {
        window.location.href = url;
      } else {
        toast.error("Erro ao criar sessão de checkout");
      }
    } catch (error) {
      toast.error("Erro ao processar upgrade");
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading("manage");
    try {
      const formData = new FormData();
      formData.append("plan", "manage");

      const { url, error } = await createCheckoutSession(formData);
      if (error) {
        toast.error(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast.error("Erro ao acessar portal do cliente");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
          Escolha seu plano
        </h2>
        <p className="text-muted-foreground mt-2">
          Comece grátis e faça upgrade quando precisar
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Plano Free */}
        <Card className="group relative rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 hover:shadow-xl border-muted/50 hover:border-muted">
          {currentPlan === "FREE" && (
            <Badge className="absolute -top-3 right-4 bg-green-600 z-10 shadow-lg px-3 py-1">
              Plano Atual
            </Badge>
          )}

          {/* Gradiente sutil no fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

          <div className="relative">
            <CardHeader className={currentPlan === "FREE" ? "pt-8" : "pb-6"}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground/90 group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:via-slate-700 group-hover:to-slate-600 dark:group-hover:from-slate-200 dark:group-hover:via-slate-300 dark:group-hover:to-slate-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-200">
                  Free
                </CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                Perfeito para começar e testar a plataforma
              </CardDescription>
              <div className="text-3xl font-bold text-foreground mt-3">
                R$ 0
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /mês
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">5 boards</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">5 membros</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">10 colunas por board</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">100 cards por board</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">20 labels por board</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Plano Atual
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* Plano Pro */}
        <Card className="group relative rounded-2xl border-2 border-primary bg-card/90 backdrop-blur-sm p-6 shadow-xl transition-all duration-200 hover:shadow-2xl">
          {currentPlan === "PRO" && (
            <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-purple-600 z-10 shadow-lg px-3 py-1">
              Plano Atual
            </Badge>
          )}

          {/* Gradiente sutil no fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-blue-50/40 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

          <div className="relative">
            <CardHeader className={currentPlan === "PRO" ? "pt-8" : "pb-6"}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold text-foreground/90 group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:via-slate-700 group-hover:to-slate-600 dark:group-hover:from-slate-200 dark:group-hover:via-slate-300 dark:group-hover:to-slate-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-200">
                    Pro
                  </CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                Para equipes que precisam de mais recursos
              </CardDescription>
              <div className="text-3xl font-bold text-foreground mt-3">
                R$ 29
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  /mês
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">Boards ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">50 membros</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">
                    50 colunas por board
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">
                    1000 cards por board
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">
                    100 labels por board
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">
                    Suporte prioritário
                  </span>
                </li>
              </ul>

              {currentPlan === "PRO" ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoading === "manage"}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {isLoading === "manage"
                    ? "Carregando..."
                    : "Gerenciar Assinatura"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade("PRO")}
                  disabled={isLoading === "PRO"}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {isLoading === "PRO" ? "Carregando..." : "Fazer Upgrade"}
                </Button>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      <div className="text-center mt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <p>
            Todos os planos incluem 7 dias de teste gratuito. Cancele a qualquer
            momento.
          </p>
        </div>
      </div>
    </div>
  );
}
