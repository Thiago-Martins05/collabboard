import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiRateLimit } from "./lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Monitorar performance com Sentry
  const transaction = Sentry.startTransaction({
    name: `${request.method} ${pathname}`,
    op: "http.server",
  });

  try {
    // Rate limiting para endpoints de API
    if (pathname.startsWith("/api/")) {
      const rateLimitResult = await apiRateLimit(request, pathname);

      if (!rateLimitResult.success) {
        return new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded",
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": rateLimitResult.limit.toString(),
              "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
              "X-RateLimit-Reset": rateLimitResult.reset.toString(),
              "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            },
          }
        );
      }
    }

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

    const response = NextResponse.next();

    // Adicionar headers de rate limit
    if (pathname.startsWith("/api/")) {
      const rateLimitResult = await apiRateLimit(request, pathname);
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitResult.limit.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.reset.toString()
      );
    }

    return response;
  } catch (error) {
    // Capturar erros no Sentry
    Sentry.captureException(error, {
      tags: {
        middleware: "true",
        pathname,
      },
      extra: {
        method: request.method,
        url: request.url,
      },
    });

    // Em caso de erro, permitir que a requisição continue
    return NextResponse.next();
  } finally {
    transaction.finish();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
