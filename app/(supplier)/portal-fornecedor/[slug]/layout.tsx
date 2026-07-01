import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";

export const dynamic = "force-dynamic";

export default async function SupplierLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);
  const session = await requireSession();

  if (session.user.escopo !== "FORNECEDOR" && session.user.escopo !== "PLATAFORMA") {
    redirect("/login");
  }
  if (session.user.escopo === "FORNECEDOR" && session.user.tenantId !== tenant.id) {
    redirect("/login");
  }

  const NAV: NavItem[] = [
    { href: `/portal-fornecedor/${slug}`, label: "Visão geral", icon: "layoutdashboard" },
    { href: `/portal-fornecedor/${slug}/ofertas/nova`, label: "Nova oferta", icon: "pluscircle" },
    { href: `/portal-fornecedor/${slug}/ofertas`, label: "Minhas ofertas", icon: "package" },
  ];

  return (
    <PortalShell
      navItems={NAV}
      brand={{
        href: `/portal-fornecedor/${slug}`,
        label: tenant.nome,
        caption: "Portal do Fornecedor",
      }}
      usuario={{
        nome: session.user.name ?? "Fornecedor",
        email: session.user.email ?? "",
        subtitulo: "Fornecedor",
      }}
    >
      {children}
    </PortalShell>
  );
}
