import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";
import { requireScope } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/admin", label: "Visão geral", icon: "layoutdashboard" },
  { href: "/admin/tenants", label: "Tenants", icon: "building2" },
  { href: "/admin/planos", label: "Planos", icon: "creditcard" },
  { href: "/admin/metricas", label: "Métricas globais", icon: "barchart3" },
  { href: "/admin/impersonar", label: "Impersonação auditada", icon: "shieldalert" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "settings" },
];

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireScope("PLATAFORMA");
  return (
    <PortalShell
      navItems={NAV}
      brand={{
        href: "/admin",
        label: "AutoGestão",
        caption: "Painel da Plataforma",
      }}
      usuario={{
        nome: session.user.name ?? "Super Admin",
        email: session.user.email ?? "",
        subtitulo: "Super Admin",
      }}
    >
      {children}
    </PortalShell>
  );
}
