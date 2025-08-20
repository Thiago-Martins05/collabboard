"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import {
  Github,
  Mail,
  Sparkles,
  Users,
  Zap,
  Shield,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("email-login", {
        email,
        name,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Erro ao fazer login. Tente novamente.");
      } else if (result?.ok) {
        toast.success("Login realizado com sucesso!");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/50 dark:bg-purple-900/20 blur-3xl"></div>
      </div>

      <main className="relative min-h-dvh grid place-items-center p-6">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CollabBoard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Kanban colaborativo para equipes
            </p>
          </div>

          {/* Login card */}
          <div className="w-full rounded-2xl border bg-card/80 backdrop-blur-sm p-8 text-card-foreground shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Entre com sua conta para continuar
              </p>
            </div>

            {/* Formulário de Email */}
            <form onSubmit={handleEmailLogin} className="grid gap-4 mb-6">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
                <Input
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <LogIn className="mr-3 h-5 w-5" />
                {isLoading ? "Entrando..." : "Entrar com Email"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <Button
                onClick={() => {
                  console.log("🔍 Tentando login com GitHub...");
                  signIn("github", { callbackUrl: "/dashboard" }).catch(
                    (error) => {
                      console.error("❌ Erro no login GitHub:", error);
                    }
                  );
                }}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
                size="lg"
              >
                <Github className="mr-3 h-5 w-5" />
                Continuar com GitHub
              </Button>

              <Button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
                size="lg"
                variant="outline"
              >
                <Mail className="mr-3 h-5 w-5" />
                Continuar com Google
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-center text-xs text-muted-foreground">
                Problemas para entrar?{" "}
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Voltar ao início
                </Link>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Colaboração</p>
              <p className="text-xs text-muted-foreground">
                Trabalhe em equipe
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Produtividade</p>
              <p className="text-xs text-muted-foreground">Organize tarefas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Seguro</p>
              <p className="text-xs text-muted-foreground">Dados protegidos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
