"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Settings } from "lucide-react";
import { createLabel, deleteLabel, updateLabel } from "./label-actions";

const labelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Máximo 50 caracteres"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hex válido"),
});

type LabelFormValues = z.infer<typeof labelSchema>;

interface LabelData {
  id: string;
  name: string;
  color: string;
}

interface ManageLabelsDialogProps {
  boardId: string;
  labels: LabelData[];
  trigger: React.ReactNode;
}

const colorOptions = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export function ManageLabelsDialog({ boardId, labels, trigger }: ManageLabelsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingLabel, setEditingLabel] = useState<LabelData | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LabelFormValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: { name: "", color: "#3b82f6" },
  });

  const selectedColor = watch("color");

  function onSubmit(values: LabelFormValues) {
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("name", values.name.trim());
    formData.set("color", values.color);

    if (editingLabel) {
      formData.set("labelId", editingLabel.id);
    }

    startTransition(async () => {
      const id = toast.loading(editingLabel ? "Atualizando label..." : "Criando label...");
      
      const res = editingLabel 
        ? await updateLabel({ ok: false }, formData)
        : await createLabel({ ok: false }, formData);

      if (res?.ok) {
        toast.success(
          editingLabel ? "Label atualizada com sucesso!" : "Label criada com sucesso!", 
          { id }
        );
        setOpen(false);
        reset();
        setEditingLabel(null);
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao salvar label", { id });
      }
    });
  }

  function handleEdit(label: LabelData) {
    setEditingLabel(label);
    setValue("name", label.name);
    setValue("color", label.color);
  }

  function handleCancel() {
    setEditingLabel(null);
    reset();
  }

  function handleDelete(labelId: string) {
    const formData = new FormData();
    formData.set("labelId", labelId);
    formData.set("boardId", boardId);

    startTransition(async () => {
      const id = toast.loading("Excluindo label...");
      const res = await deleteLabel({ ok: false }, formData);
      
      if (res?.ok) {
        toast.success("Label excluída com sucesso!", { id });
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao excluir label", { id });
      }
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setEditingLabel(null);
      reset();
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para criar/editar label */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {editingLabel ? "Editar Label" : "Criar Nova Label"}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex.: Bug, Feature, Design..."
                  disabled={isPending}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color 
                          ? "border-gray-800 scale-110" 
                          : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setValue("color", color)}
                    />
                  ))}
                </div>
                <Input
                  type="text"
                  placeholder="#3b82f6"
                  disabled={isPending}
                  {...register("color")}
                />
                {errors.color && (
                  <p className="text-xs text-destructive">{errors.color.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                {editingLabel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingLabel ? "Atualizar" : "Criar"} Label
                </Button>
              </div>
            </form>
          </div>

          {/* Lista de labels existentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Labels Existentes</h3>
            
            {labels.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma label criada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: label.color + "20",
                          color: label.color,
                          border: `1px solid ${label.color}40`,
                        }}
                      >
                        {label.name}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(label)}
                        disabled={isPending}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(label.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
