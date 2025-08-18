"use client";

import { useActionState, useTransition, FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnSchema, type CreateColumnInput } from "./schema";
import { createColumn } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export function CreateColumnForm({ boardId }: { boardId: string }) {
  // server action como stateful (React 19)
  const [state, formAction] = useActionState(createColumn, {
    ok: false as boolean,
    error: undefined as string | undefined,
  });

  // transição para controlar o loading do botão
  const [isPending, start] = useTransition();
  const router = useRouter();

  const form = useForm<CreateColumnInput>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: { title: "" },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("boardId", boardId); // garantia
    start(() => formAction(fd)); // dispara a action dentro da transição
    form.reset();
    start(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor="new-col">Nova coluna</Label>
      <div className="flex gap-2">
        <Input
          id="new-col"
          placeholder="Ex: Backlog"
          {...form.register("title")}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? "Adicionando..." : "Adicionar"}
        </Button>
      </div>

      {form.formState.errors.title && (
        <p className="text-sm text-red-500">
          {form.formState.errors.title.message}
        </p>
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
