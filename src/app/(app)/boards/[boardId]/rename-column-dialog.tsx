"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { renameColumn } from "./actions";

const schema = z.object({
  title: z.string().min(1, "Informe um título"),
});
type FormValues = z.infer<typeof schema>;

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useState<{ ok: boolean; error?: string }>({
    ok: false,
    error: undefined,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: currentTitle },
  });

  useEffect(() => {
    if (open) {
      form.reset({ title: currentTitle });
    }
  }, [open, currentTitle, form]);

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("boardId", boardId);
    fd.set("columnId", columnId);
    fd.set("title", values.title.trim());

    startTransition(async () => {
      const id = toast.loading("Renomeando…");
      const res = await renameColumn({ ok: false }, fd);
      if (res.ok) {
        setOpen(false);
        toast.success("Coluna renomeada!", { id });
        setTimeout(() => router.refresh(), 350);
      } else {
        toast.error(res.error ?? "Falha ao renomear.", { id });
      }
      // só para manter compatibilidade caso você use esse state em outro ponto:
      form.reset({ title: values.title.trim() });
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Renomear coluna</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <Input
            placeholder="Título"
            disabled={isPending}
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel type="button" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
