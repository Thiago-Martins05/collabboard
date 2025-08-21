import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Verificar autenticação para rotas protegidas
    if (pathname.startsWith("/(app)")) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        const url = new URL("/sign-in", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }

    // Verificar se é uma rota de convite
    if (pathname.startsWith("/invites/")) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Se já está logado, redirecionar para o dashboard
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Se não for página inicial e não estiver logado, redirecionar para login
    if (pathname !== "/" && pathname !== "/sign-in") {
      // Verificar se é um arquivo estático
      const isStaticFile =
        /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(
          pathname
        );

      if (!isStaticFile) {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token && !pathname.startsWith("/api/")) {
          const url = new URL("/sign-in", request.url);
          url.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(url);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Em caso de erro, permitir que a requisição continue
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
