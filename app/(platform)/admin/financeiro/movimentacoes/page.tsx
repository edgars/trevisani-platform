import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";
import { formatCentavos } from "@/lib/utils";
import { MovimentacoesFilter } from "./movimentacoes-filter";

export const metadata = { title: "Movimentos Financeiros da Plataforma" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDENTE: { label: "Pendente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  PAGO: { label: "Liquidado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  CANCELADO: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
};

export default async function AdminMovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string; de?: string; ate?: string; q?: string }>;
}) {
  const [filters] = await Promise.all([searchParams, requireScope("PLATAFORMA")]);

  const where = {
    ...(filters.tipo ? { tipo: filters.tipo as "ENTRADA" | "SAIDA" } : {}),
    ...(filters.status ? { status: filters.status as "PENDENTE" | "PAGO" | "CANCELADO" } : {}),
    ...(filters.q ? { descricao: { contains: filters.q, mode: "insensitive" as const } } : {}),
    ...(filters.de || filters.ate
      ? { dataCompetencia: {
          ...(filters.de ? { gte: new Date(filters.de) } : {}),
          ...(filters.ate ? { lte: new Date(filters.ate) } : {}),
        } }
      : {}),
  };

  const [movimentacoes, totais] = await Promise.all([
    prisma.movimentacaoPlataforma.findMany({
      where,
      orderBy: { dataCompetencia: "desc" },
      take: 200,
      include: {
        conta: { select: { nome: true } },
        emissor: { select: { nome: true } },
        recorrencia: { select: { id: true } },
      },
    }),
    prisma.movimentacaoPlataforma.groupBy({
      by: ["tipo"],
      where: filters.tipo ? { tipo: filters.tipo as "ENTRADA" | "SAIDA" } : {},
      _sum: { valorCentavos: true },
    }),
  ]);

  const totalEntrada = totais.find(t => t.tipo === "ENTRADA")?._sum.valorCentavos ?? 0;
  const totalSaida = totais.find(t => t.tipo === "SAIDA")?._sum.valorCentavos ?? 0;
  const saldo = totalEntrada - totalSaida;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Movimentos Financeiros</h2>
          <p className="text-sm text-muted-foreground">{movimentacoes.length} registro(s) encontrado(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link href="/admin/financeiro/recorrencias">
              <Repeat className="mr-2 h-4 w-4" />Recorrências
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/financeiro/movimentacoes/nova?tipo=SAIDA">
              <ArrowUpRight className="mr-2 h-4 w-4 text-red-500" />Nova saída (débito)
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/financeiro/movimentacoes/nova?tipo=ENTRADA">
              <ArrowDownLeft className="mr-2 h-4 w-4" />Nova entrada (crédito)
            </Link>
          </Button>
        </div>
      </div>

      {/* Totais */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Entradas", value: totalEntrada, cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Saídas", value: totalSaida, cls: "text-red-600 dark:text-red-400" },
          { label: "Saldo", value: saldo, cls: saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.cls}`}>
                {item.value < 0 ? "-" : ""}{formatCentavos(Math.abs(item.value))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MovimentacoesFilter />

      {movimentacoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-3xl">💳</p>
            <p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Descrição</th>
                    <th className="px-5 py-3 text-left">Categoria</th>
                    <th className="px-5 py-3 text-left">Emissor</th>
                    <th className="px-5 py-3 text-left">Data</th>
                    <th className="px-5 py-3 text-right">Valor</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimentacoes.map(m => {
                    const isEntrada = m.tipo === "ENTRADA";
                    const st = STATUS_LABEL[m.status] ?? STATUS_LABEL.PENDENTE;
                    return (
                      <tr key={m.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isEntrada
                              ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
                              : <ArrowUpRight className="h-4 w-4 shrink-0 text-red-500" />}
                            <div>
                              <span className="inline-flex items-center gap-1.5">
                                <Link href={`/admin/financeiro/movimentacoes/${m.id}/editar`} className="font-medium hover:underline">
                                  {m.descricao}
                                </Link>
                                {m.recorrencia && (
                                  <Repeat className="h-3 w-3 shrink-0 text-blue-500" aria-label="Gerada por recorrência" />
                                )}
                              </span>
                              {m.conta && <p className="text-xs text-muted-foreground">{m.conta.nome}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{m.categoria ?? "—"}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{m.emissor?.nome ?? "—"}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {m.dataCompetencia.toLocaleDateString("pt-BR")}
                          {m.dataVencimento && m.status === "PENDENTE" && (
                            <p className="text-[10px]">Vence: {m.dataVencimento.toLocaleDateString("pt-BR")}</p>
                          )}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold tabular-nums ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {isEntrada ? "+" : "-"}{formatCentavos(m.valorCentavos)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7">
                            <Link href={`/admin/financeiro/movimentacoes/${m.id}/editar`}>Editar</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
