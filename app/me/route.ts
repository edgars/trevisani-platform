import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * GET /me
 * Redireciona o usuário autenticado para a área correta:
 *  - Super Admin (PLATAFORMA) → /admin
 *  - Usuário de tenant → /t/[slug]
 * Usado após o login para evitar que o formulário precise conhecer o slug.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.tenantSlug) {
    redirect(`/t/${session.user.tenantSlug}`);
  }

  redirect("/admin");
}
