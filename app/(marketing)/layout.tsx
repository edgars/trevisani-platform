"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

const DEMO_URL = getTenantPublicUrl("demo");

/** Wrapper estreito usado em todas as seções da landing */
export function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 md:px-12 lg:px-20 ${className}`}>
      {children}
    </div>
  );
}

const NAV_LINKS = [
  { href: "/#funcionalidades", label: "Funcionalidades" },
  { href: "/#como-funciona",   label: "Como funciona" },
  { href: "/planos",           label: "Planos" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Wrap className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" onClick={() => setMobileOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-text.svg"
              alt="Volante7"
              style={{ height: 30 }}
              className="dark:[filter:brightness(0)_invert(1)]"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop CTA */}
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/cadastro">Começar grátis</Link>
            </Button>
            {/* Mobile: Entrar only + hamburger */}
            <Button variant="ghost" size="sm" asChild className="sm:hidden">
              <Link href="/login">Entrar</Link>
            </Button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </Wrap>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t bg-background md:hidden">
            <Wrap className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t">
                <Button asChild className="w-full">
                  <Link href="/cadastro" onClick={() => setMobileOpen(false)}>
                    Começar grátis
                  </Link>
                </Button>
              </div>
            </Wrap>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/40">
        <Wrap className="py-12">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-text.svg"
                alt="Volante7"
                style={{ height: 26 }}
                className="mb-3 dark:[filter:brightness(0)_invert(1)]"
              />
              <p className="text-sm text-muted-foreground">
                Gestão completa para revendas e concessionárias.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Produto</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</Link></li>
                <li><Link href="/planos" className="hover:text-foreground transition-colors">Planos e preços</Link></li>
                <li>
                  <Link href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Ver loja de exemplo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Sua loja</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/cadastro" className="hover:text-foreground transition-colors">Criar conta</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Acessar minha loja</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Contato</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contato@volante7.com.br</li>
                <li>volante7.com.br</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Volante7. Todos os direitos reservados.
          </div>
        </Wrap>
      </footer>
    </div>
  );
}
