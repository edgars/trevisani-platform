"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Close mobile drawer on route change (any click inside nav)
  React.useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      return !v;
    });
  }

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Brand */}
      <div
        className={cn(
          "flex items-center border-b",
          !isMobile && collapsed ? "h-20 justify-center px-2" : "h-20 px-4",
        )}
      >
        <Link
          href={brand.href}
          className="flex min-w-0 w-full flex-col items-start gap-0.5"
          onClick={() => isMobile && setMobileOpen(false)}
        >
          {!isMobile && collapsed ? (
            <SteeringWheelIcon className="mx-auto h-10 w-10 text-foreground" />
          ) : (
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
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-2 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div
        className="flex-1 overflow-y-auto"
        onClick={() => isMobile && setMobileOpen(false)}
      >
        <SidebarNav items={navItems} collapsed={!isMobile && collapsed} />
      </div>

      {/* User footer */}
      <div className={cn("space-y-1 py-3", !isMobile && collapsed ? "px-2" : "px-3")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg py-2",
            !isMobile && collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
            title={!isMobile && collapsed ? usuario.nome : undefined}
          >
            {initials(usuario.nome)}
          </div>
          {(isMobile || !collapsed) && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{usuario.nome}</p>
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
            title={!isMobile && collapsed ? "Sair" : undefined}
            className={cn(
              "w-full gap-2 rounded-full text-muted-foreground hover:text-foreground",
              !isMobile && collapsed ? "justify-center px-0" : "justify-center",
            )}
          >
            <LogOut className="h-4 w-4" />
            {(isMobile || !collapsed) && "Sair"}
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/60 dark:bg-background">
      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col transition-[width] duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Main panel ── */}
      <div className="flex min-w-0 flex-1 flex-col p-2 md:p-3 md:pl-0">
        <div className="flex min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)] flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-card dark:bg-card">
          {/* Top bar */}
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 md:gap-3 border-b px-3 md:px-5">
            {/* Mobile hamburger */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="h-9 w-9 shrink-0 rounded-xl md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Desktop collapse toggle */}
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

            {/* Mobile brand (visible when drawer is closed) */}
            <Link href={brand.href} className="flex items-center gap-1.5 md:hidden">
              <SteeringWheelIcon className="h-5 w-5 shrink-0 text-foreground" />
              <img
                src="/logo-text.svg"
                alt="Volante7"
                className="h-5 w-auto object-contain dark:[filter:brightness(0)_invert(1)]"
              />
            </Link>

            {/* Global search */}
            <div className="flex flex-1 justify-start">
              <GlobalSearch items={navItems} />
            </div>

            {/* Right actions */}
            <div className="flex shrink-0 items-center gap-1">
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

          {/* Page content — tighter padding on mobile */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 md:p-6">
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
