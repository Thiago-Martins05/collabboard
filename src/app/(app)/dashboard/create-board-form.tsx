"use client";

import { useActionState, FormEvent, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBoardSchema, CreateBoardInput } from "./schema";
import { createBoard } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function CreateBoardForm() {
  const [state, formAction] = useActionState(createBoard, {
    ok: false as boolean,
    error: undefined as string | undefined,
  });
  const [isPending, start] = useTransition();

  const form = useForm<CreateBoardInput>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: { title: "" },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(() => formAction(data))(e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Board name</Label>
        <Input
          id="title"
          type="text"
          placeholder="Ex: Fazer tarefa ..."
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? <Spinner /> : null}
        {isPending ? "Criando..." : "Criar board"}
      </button>
    </form>
  );
}
