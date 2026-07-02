"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { SteeringWheelIcon } from "@/components/icons/steering-wheel";
import { GlobalSearch } from "./global-search";
import { SidebarNav, type NavItem } from "./sidebar-nav";

const COLLAPSE_KEY = "portal:sidebar-collapsed";

export interface PortalChromeProps {
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
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function PortalChrome({
  navItems,
  brand,
  usuario,
  signOutAction,
  children,
}: PortalChromeProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      return !v;
    });
  }

  return (
    <div className="flex min-h-screen bg-muted/60 dark:bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col transition-[width] duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center border-b",
            collapsed ? "h-20 justify-center px-2" : "h-20 px-4",
          )}
        >
          <Link href={brand.href} className="flex min-w-0 w-full flex-col items-start gap-0.5">
            {collapsed ? (
              /* Sidebar recolhida: ícone de volante centralizado */
              <SteeringWheelIcon className="mx-auto h-10 w-10 text-foreground" />
            ) : (
              /* Sidebar expandida: logo texto ocupa toda a largura, altura 80px total */
              <>
                <img
                  src="/logo-text.svg"
                  alt="Volante7"
                  className="w-full object-contain dark:[filter:brightness(0)_invert(1)]"
                  style={{ height: "56px" }}
                />
                {brand.caption && (
                  <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground pl-0.5">
                    {brand.caption}
                  </p>
                )}
              </>
            )}
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={navItems} collapsed={collapsed} />
        </div>

        {/* User footer */}
        <div className={cn("space-y-1 py-3", collapsed ? "px-2" : "px-3")}>
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg py-2",
              collapsed ? "justify-center px-0" : "px-3",
            )}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
              title={collapsed ? usuario.nome : undefined}
            >
              {initials(usuario.nome)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {usuario.nome}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {usuario.subtitulo ?? usuario.email}
                </p>
              </div>
            )}
          </div>
          <form action={signOutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              title={collapsed ? "Sair" : undefined}
              className={cn(
                "w-full gap-2 rounded-full text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-center",
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Sair"}
            </Button>
          </form>
        </div>
      </aside>

      {/* ── Main panel (rounded card) ── */}
      <div className="flex min-w-0 flex-1 flex-col p-2 md:p-3 md:pl-0">
        <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-card dark:bg-card">
          {/* Top bar */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-5">
            {/* Collapse toggle (desktop) */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCollapsed}
              className="hidden h-9 w-9 shrink-0 rounded-xl md:inline-flex"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile brand */}
            <Link href={brand.href} className="flex items-center gap-2 md:hidden">
              <SteeringWheelIcon className="h-6 w-6 shrink-0 text-foreground" />
              <img
                src="/logo-text.svg"
                alt="Volante7"
                className="h-6 w-auto object-contain dark:[filter:brightness(0)_invert(1)]"
              />
            </Link>

            {/* Global search */}
            <div className="flex flex-1 justify-start">
              <GlobalSearch items={navItems} />
            </div>

            {/* Right actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <NotificationsButton />
              <ThemeToggle />
              <div
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
                title={`${usuario.nome} · ${usuario.email}`}
              >
                {initials(usuario.nome)}
              </div>
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
            <div className="flex h-full flex-col">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function NotificationsButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
      aria-label="Notificações"
    >
      <Bell className="h-4 w-4" />
    </Button>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
      aria-label="Alternar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
