import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);
  const session = await requireSession();

  if (session.user.escopo !== "CLIENTE" && session.user.escopo !== "PLATAFORMA") {
    redirect("/login");
  }
  if (session.user.escopo === "CLIENTE" && session.user.tenantId !== tenant.id) {
    redirect("/login");
  }

  const NAV: NavItem[] = [
    { href: `/portal-cliente/${slug}`, label: "Visão geral", icon: "layoutdashboard" },
    { href: `/portal-cliente/${slug}/negocios`, label: "Meus negócios", icon: "shoppingbag" },
    { href: `/portal-cliente/${slug}/documentos`, label: "Documentos", icon: "filesignature" },
  ];

  return (
    <PortalShell
      navItems={NAV}
      brand={{
        href: `/portal-cliente/${slug}`,
        label: tenant.nome,
        caption: "Portal do Cliente",
      }}
      usuario={{
        nome: session.user.name ?? "Cliente",
        email: session.user.email ?? "",
        subtitulo: "Cliente Final",
      }}
    >
      {children}
    </PortalShell>
  );
}
