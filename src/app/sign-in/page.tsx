"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LogIn, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { GoogleIcon } from "@/components/ui/google-icon";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("email-login", {
        email,
        name,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Erro ao fazer login");
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100/30 dark:bg-purple-900/10 blur-3xl"></div>
      </div>

      <main className="relative min-h-dvh grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <Image
                src="/collabboard-logo.png"
                alt="CollabBoard Logo"
                width={64}
                height={64}
                className="rounded-2xl"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
              CollabBoard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Kanban colaborativo para equipes
            </p>
          </div>

          <div className="w-full rounded-2xl border bg-card/80 backdrop-blur-sm p-6 text-card-foreground shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Entre com sua conta para continuar
              </p>
            </div>

            <form
              onSubmit={handleEmailLogin}
              className="flex flex-col gap-3 mb-6 w-full"
            >
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full px-4"
                  required
                />
                <Input
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full px-4"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                size="default"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Entrando..." : "Entrar com Email"}
              </Button>
            </form>

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

            <div className="flex flex-col gap-3 items-center">
              <Button
                onClick={() => {
                  signIn("github", { callbackUrl: "/dashboard" }).catch(
                    (error) => {
                      toast.error("Erro ao fazer login com GitHub");
                    }
                  );
                }}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white"
                size="default"
              >
                <Github className="mr-2 h-4 w-4" />
                Continuar com GitHub
              </Button>

              <Button
                onClick={() => {
                  signIn("google", { callbackUrl: "/dashboard" }).catch(
                    (error) => {
                      toast.error("Erro ao fazer login com Google");
                    }
                  );
                }}
                className="w-full h-11 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
                size="default"
                variant="outline"
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
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
                  Entre em contato
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
