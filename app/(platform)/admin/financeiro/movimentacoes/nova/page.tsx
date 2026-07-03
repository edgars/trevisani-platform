import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { MovimentacaoForm } from "./movimentacao-form";

export const metadata = { title: "Nova Movimentação" };
export const dynamic = "force-dynamic";

export default async function NovaMovimentacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const [sp] = await Promise.all([searchParams, requireScope("PLATAFORMA")]);

  const [contas, emissores] = await Promise.all([
    prisma.contaBancariaPlataforma.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, banco: true },
    }),
    prisma.emissorFinanceiroPlataforma.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true },
    }),
  ]);

  const defaultTipo = (sp.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA") as "ENTRADA" | "SAIDA";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Link href="/admin/financeiro/movimentacoes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nova movimentação</h1>
          <p className="text-sm text-muted-foreground">
            Registre uma entrada (crédito) ou saída (débito) pontual. Para despesas que se repetem todo mês, use{" "}
            <Link href="/admin/financeiro/recorrencias" className="underline underline-offset-2">Recorrências</Link>.
          </p>
        </div>
      </div>
      <MovimentacaoForm defaultTipo={defaultTipo} ctx={{ contas, emissores }} />
    </div>
  );
}
