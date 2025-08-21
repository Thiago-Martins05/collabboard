import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CreditCard, Sparkles, Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Configurações
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Gerencie as configurações da sua organização
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/settings/members">
          <Card className="group relative rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-muted/50 hover:border-muted cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            <div className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground/90 group-hover:text-foreground transition-colors">
                    Membros
                  </CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Gerencie membros, roles e permissões da organização
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Adicione, remova e gerencie os membros da sua organização com
                  controle total de permissões
                </p>
              </CardContent>
            </div>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className="group relative rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-muted/50 hover:border-muted cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-950/10 dark:to-blue-950/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            <div className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground/90 group-hover:text-foreground transition-colors">
                    Planos
                  </CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Gerencie planos e assinaturas da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Visualize e gerencie seu plano atual, faça upgrades e controle
                  os gastos
                </p>
              </CardContent>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
