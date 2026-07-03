import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { EscopoUsuario } from "@prisma/client";

// Reexport para garantir que o módulo esteja no grafo antes da augmentation.
export type _JWT = JWT;

/**
 * Configuração leve (edge-friendly) do Auth.js.
 * Providers "pesados" (bcrypt/Prisma) vivem em `auth.ts` (Node runtime).
 * Este arquivo é importado pelo middleware.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;

      // rotas públicas: landing, login, register, api público, health
      const publicRoutes = [
        "/",
        "/login",
        "/registrar",
        "/planos",
        "/esqueci-senha",
        "/redefinir-senha",
        "/api/public",
        "/api/health",
      ];
      if (publicRoutes.some((r) => path === r || path.startsWith(r + "/"))) {
        return true;
      }

      // Vitrine pública por tenant (reescrita pelo middleware para /site/[slug]/...)
      if (path.startsWith("/site/")) return true;

      // /t/[slug]/publico/... é público (portal do fornecedor futuramente)
      if (path.includes("/publico")) return true;

      if (!isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId ?? null;
        token.tenantSlug = user.tenantSlug ?? null;
        token.escopo = user.escopo;
        token.papeis = user.papeis ?? [];
        token.permissoes = user.permissoes ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.tenantSlug = (token.tenantSlug as string | null) ?? null;
        session.user.escopo = token.escopo as EscopoUsuario;
        session.user.papeis = (token.papeis as string[]) ?? [];
        session.user.permissoes = (token.permissoes as string[]) ?? [];
      }
      return session;
    },
  },
  providers: [], // preenchido em auth.ts (Node runtime)
} satisfies NextAuthConfig;

// -----------------------------------------------------------------------------
// Augment de tipos do Auth.js
// -----------------------------------------------------------------------------
declare module "next-auth" {
  interface User {
    tenantId?: string | null;
    tenantSlug?: string | null;
    escopo?: EscopoUsuario;
    papeis?: string[];
    permissoes?: string[];
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tenantId: string | null;
      tenantSlug: string | null;
      escopo: EscopoUsuario;
      papeis: string[];
      permissoes: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string | null;
    tenantSlug?: string | null;
    escopo?: EscopoUsuario;
    papeis?: string[];
    permissoes?: string[];
  }
}
