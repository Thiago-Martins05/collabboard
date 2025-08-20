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
import { Users, UserPlus, Sparkles, Shield } from "lucide-react";
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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header com branding */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Membros
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Gerencie os membros da sua organização
        </p>
      </div>

      {/* Botão de convite */}
      {canManage && (
        <div className="flex justify-center">
          <InviteDialog
            trigger={
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Convidar membro
              </Button>
            }
          />
        </div>
      )}

      {/* Card principal */}
      <Card className="rounded-2xl border bg-card/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                Membros da Organização
              </CardTitle>
              <CardDescription className="text-sm">
                {members.length} {members.length === 1 ? "membro" : "membros"}{" "}
                total
                {!canManage && " (somente visualização)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum membro encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                {canManage
                  ? "Convide o primeiro membro para começar a colaborar."
                  : "Aguarde o administrador adicionar membros à organização."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-muted/50">
                    <th className="px-4 py-4 text-left font-semibold text-foreground">
                      Usuário
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-foreground">
                      Role
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
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

      {/* Informação sobre permissões */}
      {!canManage && (
        <div className="rounded-2xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Permissões limitadas
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Apenas proprietários e administradores podem gerenciar membros
                da organização.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
