"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { createColumn, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CreateColumnForm({ boardId }: { boardId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createColumn,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Coluna criada!");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("boardId", boardId);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="new-column-title">Nova coluna</Label>
        <Input
          id="new-column-title"
          name="title"
          placeholder="Ex.: A fazer"
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adicionando..." : "Adicionar coluna"}
      </Button>
    </form>
  );
}
