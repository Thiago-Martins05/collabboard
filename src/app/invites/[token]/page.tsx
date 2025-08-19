import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { InviteActions } from "./invite-actions";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Busca o convite
  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      organization: true,
    },
  });

  // Verifica se o convite existe e não expirou
  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Convite Inválido</CardTitle>
            <CardDescription>
              Este convite não existe ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <a href="/">Voltar ao início</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se o usuário já é membro
  const existingUser = await db.user.findUnique({
    where: { email: invite.email },
    include: {
      memberships: {
        where: { organizationId: invite.organizationId },
      },
    },
  });

  if (existingUser?.memberships?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Já é Membro</CardTitle>
            <CardDescription>
              Você já é membro desta organização.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <a href="/dashboard">Ir para o Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels = {
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    MEMBER: "Membro",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Convite para Organização</CardTitle>
          <CardDescription>
            Você foi convidado para participar de uma organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {invite.organization.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Cargo: {roleLabels[invite.role]}
              </p>
              <p className="text-sm text-muted-foreground">
                E-mail: {invite.email}
              </p>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              <p>Este convite expira em:</p>
              <p className="font-medium">
                {invite.expiresAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <InviteActions token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
