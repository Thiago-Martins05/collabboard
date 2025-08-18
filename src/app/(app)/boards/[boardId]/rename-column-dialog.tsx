"use client";

import { useActionState, useEffect } from "react";
import { renameColumn } from "./manage-actions";
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

export function RenameColumnDialog({
  boardId,
  columnId,
  initial,
  trigger,
}: {
  boardId: string;
  columnId: string;
  initial: string;
  trigger: React.ReactNode;
}) {
  async function action(_: any, fd: FormData) {
    return renameColumn(boardId, columnId, fd);
  }
  const [state, formAction] = useActionState(action, {
    ok: false as boolean,
    error: undefined as string | undefined,
  });
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear coluna</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Input name="title" defaultValue={initial} autoFocus />
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
          <Button type="submit">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
