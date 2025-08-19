"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { changeRole, removeMember } from "@/app/(app)/settings/members/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Crown, Shield, User } from "lucide-react";
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

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  membershipId: string;
}

interface MemberRowProps {
  member: Member;
  currentUserRole: Role;
  currentUserId: string;
  canManage: boolean;
}

const roleLabels = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
};

const roleIcons = {
  OWNER: <Crown className="h-4 w-4 text-yellow-500" />,
  ADMIN: <Shield className="h-4 w-4 text-blue-500" />,
  MEMBER: <User className="h-4 w-4 text-gray-500" />,
};

export function MemberRow({
  member,
  currentUserRole,
  currentUserId,
  canManage,
}: MemberRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isCurrentUser = member.id === currentUserId;
  const canChangeRole =
    canManage &&
    !isCurrentUser &&
    !(member.role === "OWNER" && currentUserRole !== "OWNER");
  const canRemove =
    canManage &&
    !isCurrentUser &&
    !(member.role === "OWNER" && currentUserRole !== "OWNER");

  async function handleRoleChange(newRole: Role) {
    if (newRole === member.role) return;

    const formData = new FormData();
    formData.set("userId", member.id);
    formData.set("role", newRole);

    startTransition(async () => {
      const id = toast.loading("Alterando role...");
      const res = await changeRole({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Role alterado com sucesso!", { id });
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao alterar role", { id });
      }
    });
  }

  async function handleRemove() {
    const formData = new FormData();
    formData.set("userId", member.id);

    startTransition(async () => {
      const id = toast.loading("Removendo membro...");
      const res = await removeMember({ ok: false }, formData);
      if (res?.ok) {
        toast.success("Membro removido com sucesso!", { id });
        router.refresh();
      } else {
        toast.error(res?.error ?? "Erro ao remover membro", { id });
      }
    });
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium">{member.name}</span>
          <span className="text-sm text-muted-foreground">{member.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {roleIcons[member.role]}
          {canChangeRole ? (
            <Select
              value={member.role}
              onValueChange={(value: Role) => handleRoleChange(value)}
              disabled={isPending}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentUserRole === "OWNER" && (
                  <SelectItem value="OWNER">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Proprietário
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Membro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm">{roleLabels[member.role]}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {canRemove ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover membro</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover <strong>{member.name}</strong>{" "}
                  da organização? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-xs text-muted-foreground">
            {isCurrentUser ? "Você" : "Sem permissão"}
          </span>
        )}
      </td>
    </tr>
  );
}
