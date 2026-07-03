import type { ReactNode } from "react";
import { requireScope } from "@/lib/auth/session";
import { gerarMovimentacoesRecorrentesPendentes } from "@/lib/financeiro-plataforma/recorrencias";
import { FinanceiroTabs } from "./financeiro-tabs";

export const dynamic = "force-dynamic";

export default async function AdminFinanceiroLayout({ children }: { children: ReactNode }) {
  await requireScope("PLATAFORMA");
  await gerarMovimentacoesRecorrentesPendentes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          DRE da plataforma, contas bancárias e movimentações de entrada e saída.
        </p>
      </div>
      <FinanceiroTabs />
      {children}
    </div>
  );
}
