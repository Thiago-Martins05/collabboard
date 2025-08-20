import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { ensureUserPrimaryOrganization } from "@/lib/tenant";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      id: "email-login",
      name: "Email Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "seu-email@exemplo.com",
        },
        name: {
          label: "Nome",
          type: "text",
          placeholder: "Seu nome completo",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        try {
          // Busca ou cria o usuário
          const user = await db.user.upsert({
            where: { email: credentials.email },
            update: {
              name: credentials.name || null,
            },
            create: {
              email: credentials.email,
              name: credentials.name || null,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Erro ao autenticar usuário:", error);
          return null;
        }
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Para login com email ou OAuth
      try {
        await ensureUserPrimaryOrganization();
      } catch (e) {
        console.error("ensureUserPrimaryOrganization(signIn) failed:", e);
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) (token as any).userId = (user as any).id;
      return token;
    },

    async session({ session, token }) {
      if ((token as any).userId)
        (session as any).user.id = (token as any).userId;
      return session;
    },
  },

  events: {
    // dispara na 1ª vez que o usuário é criado no banco
    async createUser({ user }) {
      try {
        await ensureUserPrimaryOrganization();
      } catch (e) {
        console.error("ensureUserPrimaryOrganization (createUser) failed:", e);
      }
    },

    // fallback: se por algum motivo createUser não rodar, garantimos no 1º sign-in
    async signIn({ user, isNewUser }) {
      if (!isNewUser) return;
      try {
        await ensureUserPrimaryOrganization();
      } catch (e) {
        console.error("ensureUserPrimaryOrganization (signIn) failed:", e);
      }
    },
  },
};

export default authOptions;
