import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-4 w-4" />
            </div>
            <span>AutoGestão</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/#recursos" className="transition-colors hover:text-foreground">
              Recursos
            </Link>
            <Link href="/planos" className="transition-colors hover:text-foreground">
              Planos
            </Link>
            <Link href="/#integracoes" className="transition-colors hover:text-foreground">
              Integrações
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/planos">Começar</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AutoGestão. Multi-tenant SaaS.</p>
          <div className="flex gap-4">
            <Link href="/login">Entrar</Link>
            <Link href="/planos">Planos</Link>
            <Link href="/admin">Plataforma</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
