"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCard } from "./actions";
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

export function DeleteCardDialog({
  boardId,
  cardId,
  cardTitle,
  trigger,
}: {
  boardId: string;
  cardId: string;
  cardTitle: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onConfirm(fd: FormData) {
    fd.set("boardId", boardId);
    fd.set("cardId", cardId);

    const loadingId = toast.loading("Excluindo card…");
    const res = await deleteCard({ ok: false }, fd);

    if (res.ok) {
      toast.success(`Card “${cardTitle}” excluído!`, { id: loadingId });
      setOpen(false);
      setTimeout(() => router.refresh(), 120);
    } else {
      toast.error(res.error ?? "Falha ao excluir o card.", { id: loadingId });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{cardTitle}”?</AlertDialogTitle>
        </AlertDialogHeader>

        <form action={(fd) => startTransition(() => onConfirm(fd))}>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
