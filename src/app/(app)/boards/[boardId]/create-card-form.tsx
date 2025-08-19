"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

import { createCard } from "./actions";

// schema
const schema = z.object({
  title: z.string().min(1, "Informe o título"),
});

type FormValues = z.infer<typeof schema>;

export function CreateCardForm({ columnId }: { columnId: string }) {
  const router = useRouter();

  const [state, formAction] = React.useActionState(createCard, {
    ok: false,
    error: undefined as string | undefined,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Card criado!");
      router.refresh();
      reset({ title: "" });
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router, reset]);

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("title", values.title.trim());
    fd.set("columnId", columnId);

    startTransition(async () => {
      const id = toast.loading("Criando card…");
      const res = await formAction(fd);
      if (res?.ok) toast.success("Card criado com sucesso!", { id });
      else toast.error(res?.error ?? "Erro ao criar card", { id });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor={`title-${columnId}`}>Novo Card</Label>
        <Input
          id={`title-${columnId}`}
          placeholder="Ex.: Implementar API"
          disabled={isPending}
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando…
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </span>
        )}
      </Button>
    </form>
  );
}
