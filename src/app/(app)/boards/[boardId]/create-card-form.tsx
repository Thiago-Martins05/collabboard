"use client";

import { useActionState, useTransition, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCardSchema, type CreateCardInput } from "./schema";
import { createCard } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export function CreateCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const [state, formAction] = useActionState(createCard, {
    ok: false as boolean,
    error: undefined as string | undefined,
  });

  const [isPending, start] = useTransition();
  const router = useRouter();

  const form = useForm<CreateCardInput>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { title: "", description: "", columnId },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("boardId", boardId);
    fd.set("columnId", columnId);
    start(() => formAction(fd));
    form.reset({ title: "", description: "", columnId });
    start(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor={`title-${columnId}`}>Novo card</Label>
      <Input
        id={`title-${columnId}`}
        placeholder="Título"
        {...form.register("title")}
      />
      <Textarea
        placeholder="Descrição (opcional)"
        rows={3}
        {...form.register("description")}
      />

      {form.formState.errors.title && (
        <p className="text-sm text-red-500">
          {form.formState.errors.title.message}
        </p>
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2"
      >
        {isPending ? <Spinner /> : null}
        {isPending ? "Adicionando..." : "Adicionar card"}
      </Button>
    </form>
  );
}
