import Link from "next/link";
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
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-text.svg"
              alt="Volante7"
              style={{ height: 32 }}
              className="dark:[filter:brightness(0)_invert(1)]"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/#funcionalidades" className="transition-colors hover:text-foreground">
              Funcionalidades
            </Link>
            <Link href="/#como-funciona" className="transition-colors hover:text-foreground">
              Como funciona
            </Link>
            <Link href="/planos" className="transition-colors hover:text-foreground">
              Planos
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/planos">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40">
        <div className="container py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-text.svg"
                alt="Volante7"
                style={{ height: 28 }}
                className="mb-3 dark:[filter:brightness(0)_invert(1)]"
              />
              <p className="text-sm text-muted-foreground">
                Gestão completa para revendas e concessionárias de veículos.
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Produto</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</Link></li>
                <li><Link href="/planos" className="hover:text-foreground transition-colors">Planos e preços</Link></li>
                <li><Link href="/t/demo" className="hover:text-foreground transition-colors">Ver demonstração</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Sistema</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Acessar minha loja</Link></li>
                <li><Link href="/admin" className="hover:text-foreground transition-colors">Administração</Link></li>
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
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Volante7. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
