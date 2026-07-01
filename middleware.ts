import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

/**
 * Middleware de autenticação (edge-friendly).
 * A resolução detalhada de tenant por slug (banco) é feita no layout
 * do route group `/(tenant)/t/[slug]`, evitando cargas no edge.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // roda em tudo, exceto arquivos estáticos
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
