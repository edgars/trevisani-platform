import Link from "next/link";
import { type ReactNode } from "react";

const tabs = [
  { href: "",               label: "Resumo" },
  { href: "/movimentacoes", label: "Movimentações" },
  { href: "/orcamento",     label: "DRE Planejado" },
  { href: "/dre",           label: "DRE Comparativo" },
  { href: "/contas",        label: "Contas Bancárias" },
  { href: "/categorias",    label: "Categorias" },
  { href: "/configuracao",  label: "Config. Fiscal" },
];

export default async function FinanceiroLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      {/* Subnav — scroll horizontal no mobile */}
      <nav className="flex overflow-x-auto gap-1 border-b pb-0 scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={`/t/${slug}/financeiro${tab.href}`}
            className="shrink-0 rounded-t-lg border border-b-0 border-transparent px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
