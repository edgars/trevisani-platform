import { signOut } from "@/auth";
import { PortalChrome } from "./portal-chrome";
import type { NavItem } from "./sidebar-nav";

export interface PortalShellProps {
  navItems: NavItem[];
  brand: {
    href: string;
    label: string;
    caption?: string;
  };
  usuario: {
    nome: string;
    email: string;
    subtitulo?: string;
  };
  children: React.ReactNode;
}

/**
 * Shell compartilhado pelos 4 portais (admin, tenant, fornecedor, cliente).
 * Server component fino: define a server action de logout e delega o layout
 * interativo (sidebar recolhível, busca ⌘K, tema) ao PortalChrome (client).
 */
export function PortalShell({ navItems, brand, usuario, children }: PortalShellProps) {
  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <PortalChrome
      navItems={navItems}
      brand={brand}
      usuario={usuario}
      signOutAction={signOutAction}
    >
      {children}
    </PortalChrome>
  );
}
