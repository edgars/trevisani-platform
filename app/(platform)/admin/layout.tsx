import { PortalShell } from "@/components/portal/portal-shell";
import type { NavItem } from "@/components/portal/sidebar-nav";
import { requireScope } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/admin",          label: "Visão geral",          icon: "layoutdashboard", group: "Plataforma" },
  { href: "/admin/tenants",  label: "Tenants",              icon: "building2",       group: "Plataforma" },
  { href: "/admin/planos",   label: "Planos",               icon: "creditcard",      group: "Plataforma" },
  { href: "/admin/eventos",  label: "Tipos de evento",      icon: "zap",             group: "Plataforma" },
  { href: "/admin/metricas", label: "Métricas globais",     icon: "barchart3",       group: "Análise" },
  { href: "/admin/impersonar",    label: "Impersonação auditada", icon: "shieldalert", group: "Suporte" },
  { href: "/admin/configuracoes", label: "Configurações",        icon: "settings",    group: "Suporte" },
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
