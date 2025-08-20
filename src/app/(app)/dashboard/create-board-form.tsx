"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { createBoard } from "./actions";

const schema = z.object({
  title: z
    .string()
    .min(2, "Informe pelo menos 2 caracteres")
    .max(60, "Máx. 60"),
});
type FormValues = z.infer<typeof schema>;

export function CreateBoardForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });
  const [isPending, startTransition] = React.useTransition();

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("title", values.title.trim());
    startTransition(async () => {
      const id = toast.loading("Criando board…");
      const res = await createBoard({ ok: false }, fd);
      console.log("🔍 DEBUG - Form response:", res);
      console.log("🔍 DEBUG - res.ok:", res?.ok);
      console.log("🔍 DEBUG - res.error:", res?.error);

      if (res?.ok) {
        console.log("✅ DEBUG - Showing success toast");
        toast.success("Board criado com sucesso!", { id });
        router.refresh();
        reset({ title: "" });
      } else {
        console.log("❌ DEBUG - Showing error toast");
        // Se for erro de limite, mostra mensagem específica de upgrade
        if (res?.error?.includes("Limite atingido")) {
          console.log("🔍 DEBUG - Limit error detected, showing upgrade toast");
          toast.error("Faça upgrade para o plano Pro", {
            id,
            description: "Você atingiu o limite de boards no plano Free.",
            action: {
              label: "Ver planos",
              onClick: () => {
                window.location.href = "/billing";
              },
            },
          });
        } else {
          console.log("🔍 DEBUG - Generic error, showing error toast");
          toast.error(res?.error ?? "Falha ao criar board.", { id });
        }
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="title">Nome do board</Label>
          <Input
            id="title"
            placeholder="Ex.: Sprint de Setembro"
            disabled={isPending}
            {...register("title")}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <Button type="submit" className="mt-2 sm:mt-0" disabled={isPending}>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Criando…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Criar board
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
