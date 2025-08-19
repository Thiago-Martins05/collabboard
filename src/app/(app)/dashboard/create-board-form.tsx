"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { createBoard, type CreateBoardState } from "./actions";

export default function CreateBoardForm() {
  const [state, formAction] = useActionState<CreateBoardState, FormData>(
    createBoard,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Reage ao resultado da server action via `state`
  useEffect(() => {
    if (state?.ok) {
      toast.success("Board criado com sucesso!");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      // não aguarde o retorno—o `state` será atualizado pela action
      formAction(fd);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        name="title"
        placeholder="Título do board"
        className="flex-1 rounded-md border px-3 py-2 text-sm"
        disabled={isPending}
        required
      />
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
