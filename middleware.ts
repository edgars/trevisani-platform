import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

/**
 * Subdomínios reservados que nunca devem ser tratados como slug de tenant.
 */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "mail", "smtp"]);

/**
 * Middleware principal.
 *
 * 1. Se a requisição vem de um subdomínio de ROOT_DOMAIN (ex: demo.volante7.com.br),
 *    reescreve internamente para /site/[slug]/... — sem redirecionar o browser.
 * 2. Em dev local, demo.localhost:3000 segue a mesma lógica.
 * 3. Para o domínio raiz e subdomínios reservados, passa pelo Auth.js
 *    para proteger as rotas autenticadas do painel.
 */
export default auth(function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

  // Extrai o subdomínio, suportando tanto produção quanto localhost
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.slice(0, -(rootDomain.length + 1));
  } else if (hostname.endsWith(".localhost") || hostname.endsWith(".localhost:3000")) {
    // dev local: demo.localhost:3000
    subdomain = hostname.split(".")[0];
  }

  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const url = req.nextUrl.clone();
    const pathname = url.pathname;

    // Evita loop: se já está em /site/ não reescreve
    if (!pathname.startsWith("/site/")) {
      url.pathname = `/site/${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Roda em tudo, exceto arquivos estáticos e _next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)",
  ],
};
