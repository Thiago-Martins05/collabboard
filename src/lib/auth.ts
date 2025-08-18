import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
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
};
export default authOptions;
