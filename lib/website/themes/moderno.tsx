import Image from "next/image";
import Link from "next/link";
import type { WebsiteConfigData } from "@/lib/website/types";

interface ModernoLayoutProps {
  config: WebsiteConfigData;
  tenantNome: string;
  tenantSlug: string;
  children: React.ReactNode;
}

export function ModernoLayout({
  config,
  tenantNome,
  tenantSlug,
  children,
}: ModernoLayoutProps) {
  const whatsappUrl = config.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-site,var(--font-bricolage))] bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur border-b border-white/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {config.logoUrl ? (
              <Image
                src={config.logoUrl}
                alt={tenantNome}
                width={120}
                height={40}
                className="h-9 w-auto object-contain brightness-200"
              />
            ) : (
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "hsl(var(--site-accent))" }}
              >
                {tenantNome}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/estoque" className="hover:text-white transition-colors">Estoque</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
          </nav>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "hsl(var(--site-accent))",
                color: "hsl(var(--site-accent-fg))",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/5 bg-neutral-900 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p
                className="font-extrabold text-lg"
                style={{ color: "hsl(var(--site-accent))" }}
              >
                {tenantNome}
              </p>
              {config.endereco && (
                <p className="text-sm text-neutral-500 mt-1">{config.endereco}</p>
              )}
            </div>
            <nav className="flex gap-6 text-sm text-neutral-400">
              <Link href="/" className="hover:text-white transition-colors">Início</Link>
              <Link href="/estoque" className="hover:text-white transition-colors">Estoque</Link>
              <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            </nav>
          </div>
          <div className="mt-6 text-xs text-neutral-600 text-center">
            © {new Date().getFullYear()} {tenantNome} · Vitrine por{" "}
            <a href="https://volante7.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400">
              Volan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
