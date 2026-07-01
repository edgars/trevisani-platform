import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
} & Params) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);
  const session = await requireSession();

  // Cliente e fornecedor têm portais próprios: redireciona.
  if (session.user.escopo === "FORNECEDOR") {
    redirect(`/portal-fornecedor/${slug}`);
  }
  if (session.user.escopo === "CLIENTE") {
    redirect(`/portal-cliente/${slug}`);
  }

  // Super admin pode ver com impersonação; staff precisa pertencer ao tenant.
  if (
    session.user.escopo === "STAFF" &&
    session.user.tenantId !== tenant.id
  ) {
    redirect("/login");
  }

  const NAV: NavItem[] = [
    { href: `/t/${slug}`, label: "Dashboard", icon: "layoutdashboard" },
    { href: `/t/${slug}/veiculos`, label: "Estoque", icon: "car" },
    { href: `/t/${slug}/ofertas`, label: "Ofertas", icon: "package" },
    { href: `/t/${slug}/compras`, label: "Compras", icon: "shoppingcart" },
    { href: `/t/${slug}/vendas`, label: "Vendas", icon: "truck" },
    { href: `/t/${slug}/fornecedores`, label: "Fornecedores", icon: "users" },
    { href: `/t/${slug}/clientes`, label: "Clientes", icon: "users" },
    { href: `/t/${slug}/financeiro`, label: "Financeiro", icon: "wallet" },
    { href: `/t/${slug}/documentos`, label: "Documentos", icon: "filesignature" },
    { href: `/t/${slug}/relatorios`, label: "Relatórios", icon: "barchart3" },
    { href: `/t/${slug}/despesas`, label: "Despesas", icon: "receipt" },
    { href: `/t/${slug}/configuracoes`, label: "Configurações", icon: "settings" },
  ];

  return (
    <PortalShell
      navItems={NAV}
      brand={{
        href: `/t/${slug}`,
        label: tenant.nome,
        caption: `Loja · /t/${slug}`,
      }}
      usuario={{
        nome: session.user.name ?? "Operador",
        email: session.user.email ?? "",
        subtitulo:
          session.user.papeis.length > 0
            ? session.user.papeis.join(" · ")
            : "Staff",
      }}
    >
      {children}
    </PortalShell>
  );
}
