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

import { renameCard } from "./actions";

const schema = z.object({
  title: z.string().min(1, "Informe um título"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

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
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: currentTitle,
      description: currentDescription ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: currentTitle,
        description: currentDescription ?? "",
      });
    }
  }, [open, currentTitle, currentDescription, form]);

  async function onSubmit(values: FormValues) {
    const fd = new FormData();
    fd.set("boardId", boardId);
    fd.set("cardId", cardId);
    fd.set("title", values.title.trim());
    fd.set("description", (values.description ?? "").trim());

    startTransition(async () => {
      const id = toast.loading("Salvando…");
      const res = await renameCard({ ok: false }, fd);
      if (res.ok) {
        setOpen(false);
        toast.success("Card atualizado!", { id });
        setTimeout(() => router.refresh(), 350);
      } else {
        toast.error(res.error ?? "Falha ao atualizar card.", { id });
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar card</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Input
              placeholder="Título"
              disabled={isPending}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            {/* textarea nativo para evitar dependências */}
            <textarea
              rows={4}
              placeholder="Descrição (opcional)"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              {...form.register("description")}
            />
          </div>

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
