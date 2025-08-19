"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { deleteColumn, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteColumnDialog({
  boardId,
  columnId,
  columnTitle,
  trigger,
  onDeleted,
}: {
  boardId: string;
  columnId: string;
  columnTitle: string;
  trigger: React.ReactNode; // ex.: <Button type="button" ...>🗑️</Button>
  onDeleted?: () => void; // opcional: callback pós-exclusão
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    deleteColumn,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      toast.success(`Coluna “${columnTitle}” excluída!`);
      onDeleted?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}{" "}
        {/* garanta type="button" no trigger para não submeter forms */}
      </AlertDialogTrigger>

      <AlertDialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir a coluna “{columnTitle}”?</AlertDialogTitle>
        </AlertDialogHeader>

        <form
          action={(fd) => {
            fd.set("boardId", boardId);
            fd.set("columnId", columnId);
            startTransition(() => formAction(fd));
          }}
        >
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            {/* Button normal para não fechar automaticamente antes do estado chegar */}
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
