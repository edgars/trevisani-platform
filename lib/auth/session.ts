import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { EscopoUsuario } from "@prisma/client";

/**
 * Recupera a sessão atual. Retorna null se não autenticado.
 */
export async function getSession() {
  return auth();
}

/**
 * Força autenticação. Redireciona para /login se ausente.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Força autenticação e escopo específico.
 */
export async function requireScope(escopo: EscopoUsuario | EscopoUsuario[]) {
  const session = await requireSession();
  const escopos = Array.isArray(escopo) ? escopo : [escopo];
  if (!escopos.includes(session.user.escopo)) {
    redirect("/login");
  }
  return session;
}

/**
 * Força que o usuário pertença a um tenant específico (por slug ou id).
 */
export async function requireTenant(opts: { slug?: string; id?: string }) {
  const session = await requireSession();
  if (!session.user.tenantId) {
    redirect("/login");
  }
  if (opts.id && session.user.tenantId !== opts.id) {
    redirect("/login");
  }
  return session;
}

/**
 * Retorna true se o usuário tem a permissão (por slug).
 */
export async function hasPermission(slug: string) {
  const session = await auth();
  return session?.user?.permissoes?.includes(slug) ?? false;
}

/**
 * Barreira de permissão em Server Actions / rotas.
 */
export async function requirePermission(slug: string) {
  const ok = await hasPermission(slug);
  if (!ok) {
    throw new Error(`Sem permissão: ${slug}`);
  }
}
