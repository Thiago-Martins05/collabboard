"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { forceUpgradeToPro } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ForceUpgradeButtonProps {
  organizationId: string;
}

export function ForceUpgradeButton({
  organizationId,
}: ForceUpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForceUpgrade = async () => {
    setIsLoading(true);
    try {
      const result = await forceUpgradeToPro();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Upgrade para PRO realizado com sucesso!");

      // Recarrega a página para mostrar as mudanças
      router.refresh();
    } catch (error) {
      toast.error("Erro ao forçar upgrade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleForceUpgrade}
        disabled={isLoading}
        variant="outline"
        className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
      >
        {isLoading ? "Processando..." : "🧪 Forçar Upgrade para PRO"}
      </Button>

      <div className="text-xs text-yellow-600">
        <p>• Este botão só aparece em desenvolvimento</p>
        <p>• Simula o upgrade para PRO sem pagamento</p>
        <p>• Útil para testar a funcionalidade</p>
      </div>
    </div>
  );
}
