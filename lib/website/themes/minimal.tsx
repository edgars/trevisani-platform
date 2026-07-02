import Image from "next/image";
import Link from "next/link";
import type { WebsiteConfigData } from "@/lib/website/types";

interface MinimalLayoutProps {
  config: WebsiteConfigData;
  tenantNome: string;
  tenantSlug: string;
  children: React.ReactNode;
}

export function MinimalLayout({
  config,
  tenantNome,
  children,
}: MinimalLayoutProps) {
  const whatsappUrl = config.whatsapp
    ? `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-site,var(--font-bricolage))] bg-white text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-100 py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/">
            {config.logoUrl ? (
              <Image
                src={config.logoUrl}
                alt={tenantNome}
                width={100}
                height={36}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-sm font-semibold uppercase tracking-widest text-neutral-800">
                {tenantNome}
              </span>
            )}
          </Link>

          <nav className="flex items-center gap-6 text-xs font-medium uppercase tracking-widest text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">Início</Link>
            <Link href="/estoque" className="hover:text-neutral-900 transition-colors">Estoque</Link>
            <Link href="/contato" className="hover:text-neutral-900 transition-colors">Contato</Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-100 py-8">
        <div className="container mx-auto px-4 text-center text-xs text-neutral-400 space-y-1">
          <p>{tenantNome}{config.endereco ? ` · ${config.endereco}` : ""}</p>
          <p>
            Vitrine por{" "}
            <a href="https://volante7.com.br" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Volan
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
