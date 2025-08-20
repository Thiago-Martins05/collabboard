"use client";

import { AlertTriangle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface LimitsBannerProps {
  feature: string;
  current: number;
  max: number;
}

export function LimitsBanner({ feature, current, max }: LimitsBannerProps) {
  const handleUpgrade = () => {
    // TODO: Redirecionar para página de billing
    console.log("Redirecionar para billing");
  };
  const usagePercentage = (current / max) * 100;
  const isAtLimit = current >= max;
  const isNearLimit = usagePercentage >= 80;

  if (!isAtLimit && !isNearLimit) return null;

  return (
    <Alert
      className={`mb-4 ${
        isAtLimit
          ? "border-red-200 bg-red-50"
          : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {isAtLimit ? (
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        )}

        <div className="flex-1">
          <AlertTitle
            className={isAtLimit ? "text-red-800" : "text-yellow-800"}
          >
            {isAtLimit
              ? `Limite de ${feature} atingido!`
              : `Próximo do limite de ${feature}`}
          </AlertTitle>
          <div
            className={`${
              isAtLimit ? "text-red-700" : "text-yellow-700"
            } text-sm leading-relaxed`}
          >
            {isAtLimit
              ? `Você atingiu o máximo de ${max} ${feature} no plano Free. Faça upgrade para o plano Pro para criar mais.`
              : `Você está usando ${current} de ${max} ${feature} (${Math.round(
                  usagePercentage
                )}%). Faça upgrade para o plano Pro para criar mais.`}
          </div>
        </div>

        <Button
          onClick={handleUpgrade}
          size="sm"
          className={`flex items-center gap-2 ${
            isAtLimit
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-yellow-600 hover:bg-yellow-700 text-white"
          }`}
        >
          <Crown className="h-3 w-3" />
          Upgrade Pro
        </Button>
      </div>
    </Alert>
  );
}
