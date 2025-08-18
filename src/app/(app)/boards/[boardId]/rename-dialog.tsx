"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { renameSchema, type RenameInput } from "./edit-schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  trigger: React.ReactNode;
  initial: string;
  onSubmit: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export function RenameDialog({ trigger, initial, onSubmit }: Props) {
  const form = useForm<RenameInput>({
    resolver: zodResolver(renameSchema),
    defaultValues: { title: initial },
  });
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            start(async () => {
              const res = await onSubmit(fd);
              if (!res.ok) {
                form.setError("title", { message: res.error || "Erro" });
              } else {
                router.refresh();
              }
            });
          }}
        >
          <Input
            autoFocus
            {...form.register("title")}
            placeholder="Novo título"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">
              {form.formState.errors.title.message}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
