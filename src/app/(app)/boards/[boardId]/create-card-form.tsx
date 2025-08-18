"use client";

import { useActionState, FormEvent, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCardSchema, type CreateCardInput } from "./schema";
import { createCard } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const form = useForm<CreateCardInput>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { title: "", description: "", columnId },
  });
  const router = useRouter();
  const [isPending, start] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("boardId", boardId);
    data.set("columnId", columnId);
    formAction(data);
    form.reset({ title: "", description: "", columnId });
    start(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor={`card-title-${columnId}`}>Novo card</Label>
      <Input
        id={`card-title-${columnId}`}
        placeholder="Título"
        {...form.register("title")}
      />
      <Textarea
        placeholder="Descrição (opcional)"
        {...form.register("description")}
      />
      {form.formState.errors.title && (
        <p className="text-sm text-red-500">
          {form.formState.errors.title.message}
        </p>
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        Adicionar card
      </Button>
    </form>
  );
}
