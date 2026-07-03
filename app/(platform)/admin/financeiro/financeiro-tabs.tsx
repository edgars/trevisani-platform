"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/financeiro",                label: "Visão geral (DRE)" },
  { href: "/admin/financeiro/movimentacoes",  label: "Movimentos Financeiros" },
  { href: "/admin/financeiro/recorrencias",   label: "Recorrências" },
  { href: "/admin/financeiro/contas",         label: "Contas Bancárias" },
  { href: "/admin/financeiro/emissores",      label: "Fornecedores / Emissores" },
];

export function FinanceiroTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-0">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin/financeiro"
            ? pathname === tab.href
            : pathname === tab.href || pathname?.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-t-lg border border-b-0 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "border-border bg-background text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
