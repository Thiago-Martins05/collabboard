"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { renameColumn, type ActionState } from "./actions";
import { Input } from "@/components/ui/input";
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

export function RenameColumnDialog({
  boardId,
  columnId,
  currentTitle,
  trigger,
}: {
  boardId: string;
  columnId: string;
  currentTitle: string;
  trigger: React.ReactNode;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    renameColumn,
    { ok: false }
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);

  // sempre que abrir, sincroniza o título atual
  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  // responde ao resultado da action (sem depender do "open")
  useEffect(() => {
    if (state?.ok) {
      toast.success("Coluna renomeada!");
      setOpen(false); // fecha somente quando OK
    } else if (state?.error) {
      toast.error(state.error);
      // mantém aberto para o usuário corrigir
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent
        key={open ? "open" : "closed"} // força remount limpinho a cada abertura
        onPointerDownOutside={(e) => e.preventDefault()} // evita fechar sem querer
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Renomear coluna</AlertDialogTitle>
        </AlertDialogHeader>

        <form
          action={(fd) => {
            fd.set("boardId", boardId);
            fd.set("columnId", columnId);
            fd.set("title", title);
            startTransition(() => formAction(fd));
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor={`rename-col-${columnId}`}>Novo título</Label>
            <Input
              id={`rename-col-${columnId}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              disabled={isPending}
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            {/* 👉 Button normal, NÃO fecha o dialog automaticamente */}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
