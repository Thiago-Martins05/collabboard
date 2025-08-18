"use client";

import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnSchema, type CreateColumnInput } from "./schema";
import { createColumn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateColumnForm({ boardId }: { boardId: string }) {
  const [state, formAction] = useFormState(createColumn, { ok: false });
  const form = useForm<CreateColumnInput>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: { title: "" },
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set("boardId", boardId);

    formAction(data);
    form.reset();

    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor="col-title">Nova coluna</Label>
      <div className="flex gap-2">
        <Input
          id="col-title"
          placeholder="Ex: Backlog"
          {...form.register("title")}
        />
        <Button type="submit" disabled={isPending}>
          Adicionar
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
