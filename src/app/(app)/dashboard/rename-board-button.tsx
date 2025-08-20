"use client";

import { useTransition } from "react";
import { renameBoard } from "../boards/[boardId]/manage-actions";
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
import { Pencil } from "lucide-react";

export function RenameBoardButton({
  boardId,
  boardTitle,
}: {
  boardId: string;
  boardTitle: string;
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
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Renomear board ${boardTitle}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear board</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <Input name="title" defaultValue={boardTitle} autoFocus />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
