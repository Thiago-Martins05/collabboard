"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteColumn } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  trigger: React.ReactNode;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onConfirm(fd: FormData) {
    fd.set("boardId", boardId);
    fd.set("columnId", columnId);

    const id = toast.loading("Excluindo coluna…");
    const res = await deleteColumn({ ok: false }, fd);

    if (res.ok) {
      setOpen(false);
      onDeleted?.();
      toast.success(`Coluna “${columnTitle}” excluída!`, { id });
      setTimeout(() => router.refresh(), 400);
    } else {
      toast.error(res.error ?? "Falha ao excluir a coluna.", { id });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{columnTitle}”?</AlertDialogTitle>
        </AlertDialogHeader>

        <form action={(fd) => startTransition(() => onConfirm(fd))}>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo…
                </span>
              ) : (
                "Excluir"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
