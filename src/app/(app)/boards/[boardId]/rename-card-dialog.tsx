"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { renameCard, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export function RenameCardDialog({
  boardId,
  cardId,
  currentTitle,
  currentDescription,
  trigger,
}: {
  boardId: string;
  cardId: string;
  currentTitle: string;
  currentDescription?: string | null;
  trigger: React.ReactNode; // ex.: <Button type="button" ...>✏️</Button>
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    renameCard,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription ?? "");
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTitle(currentTitle);
      setDescription(currentDescription ?? "");
    }
  }, [open, currentTitle, currentDescription]);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Card atualizado!");
      setOpen(false);
      router.refresh();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger type="button" asChild>
        {trigger}
      </AlertDialogTrigger>

      <AlertDialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar card</AlertDialogTitle>
        </AlertDialogHeader>

        <form
          action={(fd) => {
            fd.set("boardId", boardId);
            fd.set("cardId", cardId);
            // title e/ou description podem ser enviados (server action permite parciais)
            fd.set("title", title);
            fd.set("description", description);
            startTransition(() => formAction(fd));
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor={`edit-card-title-${cardId}`}>Título</Label>
            <Input
              id={`edit-card-title-${cardId}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={2}
              maxLength={120}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`edit-card-desc-${cardId}`}>Descrição</Label>
            <Textarea
              id={`edit-card-desc-${cardId}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isPending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
