"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

import { createColumn } from "./actions";

// schema
const schema = z.object({
  title: z.string().min(1, "Informe um título"),
});

type FormValues = z.infer<typeof schema>;

export function CreateColumnForm() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

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
    fd.set("boardId", boardId);

    startTransition(async () => {
      const id = toast.loading("Criando coluna…");
      const res = await createColumn({ ok: false }, fd);
      if (res?.ok) {
        toast.success("Coluna criada com sucesso!", { id });
        router.refresh();
        reset({ title: "" });
      } else {
        toast.error(res?.error ?? "Erro ao criar coluna", { id });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor="title">Novo Card</Label>
        <Input
          id="title"
          placeholder="Ex.: A fazer..."
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
