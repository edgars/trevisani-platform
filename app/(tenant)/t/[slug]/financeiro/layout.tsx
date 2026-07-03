import Link from "next/link";
import { type ReactNode } from "react";

const tabs = [
  { href: "", label: "Resumo" },
  { href: "/movimentacoes", label: "Movimentações" },
  { href: "/dre", label: "DRE" },
  { href: "/contas", label: "Contas Bancárias" },
  { href: "/categorias", label: "Categorias" },
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
      {/* Subnav */}
      <nav className="flex flex-wrap gap-1 border-b pb-0">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={`/t/${slug}/financeiro${tab.href}`}
            className="rounded-t-lg border border-b-0 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-border data-[active]:bg-background data-[active]:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
