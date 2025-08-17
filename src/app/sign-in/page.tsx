"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-card-foreground shadow">
        <h1 className="mb-2 text-2xl font-semibold">Entrar</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Use sua conta para acessar o CollabBoard.
        </p>

        <div className="grid gap-3">
          <Button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" />
            Entrar com GitHub
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Problemas?{" "}
          <Link href="/" className="underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </main>
  );
}
