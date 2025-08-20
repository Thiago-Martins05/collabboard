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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

import { createCard } from "./actions";

// schema
const schema = z.object({
  title: z.string().min(1, "Informe o título"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateCardForm({
  columnId,
  boardId,
}: {
  columnId: string;
  boardId: string;
}) {
  const router = useRouter();

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

  function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("title", values.title.trim());
    fd.set("description", values.description?.trim() || "");
    fd.set("columnId", columnId);
    fd.set("boardId", boardId);

    startTransition(async () => {
      const id = toast.loading("Criando card…");
      const res = await createCard({ ok: false }, fd);
      if (res?.ok) {
        toast.success("Card criado com sucesso!", { id });
        router.refresh();
        reset({ title: "" });
      } else {
        toast.error(res?.error ?? "Erro ao criar card", { id });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`title-${columnId}`}>Título</Label>
        <Input
          id={`title-${columnId}`}
          placeholder="Ex.: Implementar API"
          disabled={isPending}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${columnId}`}>Descrição (opcional)</Label>
        <Textarea
          id={`description-${columnId}`}
          placeholder="Descreva o que precisa ser feito..."
          rows={3}
          disabled={isPending}
          {...register("description")}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando…
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Card
          </span>
        )}
      </Button>
    </form>
  );
}
