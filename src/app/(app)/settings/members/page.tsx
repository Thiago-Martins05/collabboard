import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { MemberRow } from "@/components/members/member-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { listMembers } from "./actions";
import { InviteDialog } from "./invite-dialog";

export default async function MembersPage() {
  // Verifica se o usuário está autenticado
  const session = await getSession();
  if (!session?.user?.email) {
    return (
      <div className="p-6">
        <p className="text-red-500">Você precisa estar autenticado.</p>
      </div>
    );
  }

  // Busca o usuário atual e sua organização
  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: { organization: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!currentUser?.memberships?.[0]?.organization) {
    return (
      <div className="p-6">
        <p className="text-red-500">Organização não encontrada.</p>
      </div>
    );
  }

  const currentUserRole = currentUser.memberships[0].role;
  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // Lista os membros
  let members: {
    id: string;
    name: string;
    email: string | null;
    role: Role;
    membershipId: string;
  }[] = [];
  let error: string | null = null;

  try {
    const result = await listMembers();
    if (result.ok) {
      members = result.data;
    } else {
      error = result.error;
    }
  } catch (e) {
    error = "Erro ao carregar membros.";
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua organização
          </p>
        </div>
        {canManage && (
          <InviteDialog
            trigger={
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar membro
              </Button>
            }
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Organização
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "membro" : "membros"} total
            {!canManage && " (somente visualização)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum membro encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Usuário</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(
                    (member: {
                      id: string;
                      name: string;
                      email: string | null;
                      role: Role;
                      membershipId: string;
                    }) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        currentUserRole={currentUserRole}
                        currentUserId={currentUser.id}
                        canManage={canManage}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!canManage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Informação:</strong> Apenas proprietários e administradores
            podem gerenciar membros.
          </p>
        </div>
      )}
    </div>
  );
}
