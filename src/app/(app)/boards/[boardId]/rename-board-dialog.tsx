"use client";

import { useTransition } from "react";
import { renameBoard } from "./manage-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RenameBoardDialog({
  boardId,
  initial,
  trigger,
}: {
  boardId: string;
  initial: string;
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const id = toast.loading("Renomeando board…");
      const res = await renameBoard(boardId, formData);
      if (res?.ok) {
        toast.success("Board renomeado com sucesso!", { id });
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao renomear board", { id });
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear board</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <Input name="title" defaultValue={initial} autoFocus />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
