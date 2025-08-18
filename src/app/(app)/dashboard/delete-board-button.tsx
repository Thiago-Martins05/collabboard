"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBoard } from "./actions";
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
import { Spinner } from "@/components/ui/spinner";

export function DeleteBoardButton({
  boardId,
  boardTitle,
  onAfterDelete,
}: {
  boardId: string;
  boardTitle: string;
  onAfterDelete?: () => void;
}) {
  // useActionState espera (prevState, formData) => Promise<state>
  const [state, formAction] = useActionState(deleteBoard, {
    ok: false as boolean,
    error: undefined as string | undefined,
  });
  const router = useRouter();
  const [isPending, start] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      toast.success(`Board “${boardTitle}” excluído.`);
      router.refresh();
      onAfterDelete?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.ok, state?.error, boardTitle, router, onAfterDelete]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Excluir board ${boardTitle}`}
        >
          <Trash2 className="h-4 w-4 cursor-pointer" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{boardTitle}”?</AlertDialogTitle>
        </AlertDialogHeader>

        <form action={(fd) => start(() => formAction(fd))}>
          <input type="hidden" name="boardId" value={boardId} />
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2"
            >
              {isPending ? <Spinner /> : null}
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
