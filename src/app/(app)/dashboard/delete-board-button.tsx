"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeleteBoardState, deleteBoard } from "./actions";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteBoardButton({
  boardId,
  boardTitle,
  onAfterDelete,
}: {
  boardId: string;
  boardTitle: string;
  onAfterDelete?: () => void;
}) {
  // Server Action via useActionState (React 19)
  const [state, formAction] = useActionState<DeleteBoardState, FormData>(
    deleteBoard,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // escuta resultado da action
  useEffect(() => {
    if (state?.ok) {
      toast.success(`Board “${boardTitle}” excluído.`);
      onAfterDelete?.();
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok, state?.error]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="h-8 w-8 rounded p-1 hover:bg-accent hover:text-accent-foreground"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Excluir board ${boardTitle}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{boardTitle}”?</AlertDialogTitle>
        </AlertDialogHeader>

        {/* IMPORTANTE: não use await, o estado volta via `state` */}
        <form
          action={(fd) => {
            fd.set("boardId", boardId);
            startTransition(() => formAction(fd));
          }}
        >
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
