"use client";

import { AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface LimitsBannerProps {
  feature: "boards" | "membros";
  current: number;
  max: number;
}

export function LimitsBanner({ feature, current, max }: LimitsBannerProps) {
  // Se o limite é ilimitado (-1), não mostra o banner
  if (max === -1) return null;

  const isAtLimit = current >= max;
  const percentage = Math.round((current / max) * 100);

  const featureLabels = {
    boards: "boards",
    membros: "membros",
  };

  const featureLabel = featureLabels[feature];

  return (
    <div
      className={`rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg ${
        isAtLimit
          ? "border-red-200/50 bg-red-50/50 dark:bg-red-950/20"
          : "border-yellow-200/50 bg-yellow-50/50 dark:bg-yellow-950/20"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Ícone */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            isAtLimit
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-yellow-100 dark:bg-yellow-900/30"
          }`}
        >
          {isAtLimit ? (
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          ) : (
            <div className="relative w-6 h-6">
              <Image
                src="/collabboard-logo.png"
                alt="CollabBoard Logo"
                width={24}
                height={24}
                className="rounded"
              />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-bold mb-2 ${
              isAtLimit
                ? "text-red-800 dark:text-red-200"
                : "text-yellow-800 dark:text-yellow-200"
            }`}
          >
            {isAtLimit
              ? `Limite de ${feature} atingido!`
              : `Próximo do limite de ${feature}`}
          </h3>

          <p
            className={`text-sm leading-relaxed mb-4 ${
              isAtLimit
                ? "text-red-700 dark:text-red-300"
                : "text-yellow-700 dark:text-yellow-300"
            }`}
          >
            {isAtLimit
              ? `Você atingiu o máximo de ${max} ${feature} no plano Free. Faça upgrade para o plano Pro para criar mais.`
              : `Você está usando ${current} de ${max} ${feature} disponíveis no plano Free. Considere fazer upgrade para o plano Pro.`}
          </p>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Uso atual</span>
              <span
                className={`font-medium ${
                  isAtLimit
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {current} / {max}
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isAtLimit
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Botão de upgrade */}
          <Button
            onClick={() => {
              // Redirecionar para a página de billing
              window.location.href = "/billing";
            }}
            className={`w-full bg-gradient-to-r shadow-lg ${
              isAtLimit
                ? "from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                : "from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
            } text-white border-0`}
          >
            <Crown className="h-4 w-4 mr-2" />
            <div className="relative w-4 h-4 mr-2">
              <Image
                src="/collabboard-logo.png"
                alt="CollabBoard Logo"
                width={16}
                height={16}
                className="rounded"
              />
            </div>
            Upgrade Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
