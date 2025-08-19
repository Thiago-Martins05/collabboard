"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@prisma/client";
import { updateCard, deleteCardModal } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Save, X } from "lucide-react";

interface CardModalProps {
  card: {
    id: string;
    title: string;
    description?: string | null;
  };
  trigger: React.ReactNode;
}

export function CardModal({ card, trigger }: CardModalProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const router = useRouter();

  async function handleSave() {
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    const formData = new FormData();
    formData.set("cardId", card.id);
    formData.set("title", title.trim());
    formData.set("description", description.trim());

    startTransition(async () => {
      const id = toast.loading("Salvando alterações...");
      const res = await updateCard({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Card atualizado com sucesso!", { id });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao atualizar card", { id });
      }
    });
  }

  async function handleDelete() {
    const formData = new FormData();
    formData.set("cardId", card.id);

    startTransition(async () => {
      const id = toast.loading("Excluindo card...");
      const res = await deleteCardModal({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Card excluído com sucesso!", { id });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao excluir card", { id });
      }
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset form when closing
      setTitle(card.title);
      setDescription(card.description || "");
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Detalhes do Card
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do card"
              disabled={isPending}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite a descrição do card (opcional)"
              rows={6}
              disabled={isPending}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
