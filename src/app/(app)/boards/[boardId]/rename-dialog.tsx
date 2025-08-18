"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { renameSchema, type RenameInput } from "./edit-schema";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget as HTMLFormElement);
            start(async () => {
              const res = await onSubmit(data);
              if (!res.ok) {
                form.setError("title", { message: res.error || "Erro" });
              } else {
                router.refresh();
              }
            });
          }}
          className="space-y-3"
        >
          <Input
            {...form.register("title")}
            placeholder="Novo título"
            autoFocus
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
