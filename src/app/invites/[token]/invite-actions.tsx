"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvite, declineInvite } from "./actions";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface InviteActionsProps {
  token: string;
}

export function InviteActions({ token }: InviteActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleAccept() {
    const formData = new FormData();
    formData.set("token", token);

    startTransition(async () => {
      const id = toast.loading("Aceitando convite...");
      const res = await acceptInvite({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Convite aceito com sucesso!", { id });
        router.push("/dashboard");
      } else {
        toast.error(res?.error ?? "Erro ao aceitar convite", { id });
      }
    });
  }

  async function handleDecline() {
    const formData = new FormData();
    formData.set("token", token);

    startTransition(async () => {
      const id = toast.loading("Recusando convite...");
      const res = await declineInvite({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Convite recusado", { id });
        router.push("/");
      } else {
        toast.error(res?.error ?? "Erro ao recusar convite", { id });
      }
    });
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Aceitar
      </Button>
      <Button
        onClick={handleDecline}
        disabled={isPending}
        variant="outline"
        className="flex-1"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Recusar
      </Button>
    </div>
  );
}
