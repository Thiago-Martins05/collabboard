"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { createCard, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // ✅ precisa do componente do shadcn

export function CreateCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createCard,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Card criado!");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("boardId", boardId);
    fd.set("columnId", columnId);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={`new-card-title-${columnId}`}>Título</Label>
        <Input
          id={`new-card-title-${columnId}`}
          name="title"
          placeholder="Adicionar card…"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`new-card-desc-${columnId}`}>
          Descrição (opcional)
        </Label>
        <Textarea
          id={`new-card-desc-${columnId}`}
          name="description"
          placeholder="Detalhes do card…"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
