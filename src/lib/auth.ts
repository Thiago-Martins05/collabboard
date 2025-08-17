import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) (session as any).user.id = token.userId;
      return session;
    },
  },
  trustHost: true,
});
