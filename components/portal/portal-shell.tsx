import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/utils";
import { SidebarNav, type NavItem } from "./sidebar-nav";

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

export function PortalShell({ navItems, brand, usuario, children }: PortalShellProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      {/* ── Sidebar ── */}
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <Link href={brand.href} className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {brand.label}
              </p>
              {brand.caption && (
                <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                  {brand.caption}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav items={navItems} />
        </div>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {initials(usuario.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {usuario.nome}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {usuario.subtitulo ?? usuario.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          {/* Mobile brand */}
          <Link
            href={brand.href}
            className="flex items-center gap-2 font-semibold md:hidden"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm">{brand.label}</span>
          </Link>

          {/* Right slot */}
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{usuario.email}</span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="font-medium text-foreground">
              {usuario.subtitulo}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
