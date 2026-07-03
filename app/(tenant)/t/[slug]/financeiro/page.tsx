import Link from "next/link";
import {
  ArrowDownLeft, ArrowUpRight, BookOpen,
  Building, CreditCard, Plus, TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totaisMes, pendentes, contas, ultimasMovs] = await Promise.all([
    prisma.movimentacao.groupBy({
      by: ["tipo"],
      where: { tenantId, dataCompetencia: { gte: inicioMes, lte: fimMes }, status: { not: "CANCELADO" } },
      _sum: { valorCentavos: true },
    }),
    prisma.movimentacao.findMany({
      where: { tenantId, status: "PENDENTE", dataVencimento: { lte: new Date(Date.now() + 7 * 86400000) } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
      select: { id: true, descricao: true, tipo: true, valorCentavos: true, dataVencimento: true },
    }),
    prisma.contaBancaria.findMany({
      where: { tenantId, ativo: true },
      select: { id: true, nome: true, banco: true, tipoConta: true },
    }),
    prisma.movimentacao.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { categoria: { select: { nome: true, cor: true } } },
    }),
  ]);

  const entradaMes = totaisMes.find(t => t.tipo === "ENTRADA")?._sum.valorCentavos ?? 0;
  const saidaMes   = totaisMes.find(t => t.tipo === "SAIDA")  ?._sum.valorCentavos ?? 0;
  const saldoMes   = entradaMes - saidaMes;

  const mesLabel = inicioMes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* KPIs do mês */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Entradas", value: entradaMes, cls: "text-emerald-600 dark:text-emerald-400", icon: ArrowDownLeft },
            { label: "Saídas",   value: saidaMes,   cls: "text-red-600 dark:text-red-400",         icon: ArrowUpRight },
            { label: "Saldo",    value: saldoMes,   cls: saldoMes >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", icon: TrendingUp },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${item.cls}`}>
                      {item.value < 0 ? "-" : ""}{formatCentavos(Math.abs(item.value))}
                    </p>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.cls} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Últimas movimentações */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Últimas movimentações</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/t/${slug}/financeiro/movimentacoes`}>Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ultimasMovs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-2">
                {ultimasMovs.map(m => (
                  <Link key={m.id} href={`/t/${slug}/financeiro/movimentacoes/${m.id}/editar`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors">
                    {m.tipo === "ENTRADA"
                      ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <ArrowUpRight  className="h-4 w-4 shrink-0 text-red-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.descricao}</p>
                      {m.categoria && <p className="text-xs text-muted-foreground">{m.categoria.nome}</p>}
                    </div>
                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${m.tipo === "ENTRADA" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {m.tipo === "ENTRADA" ? "+" : "-"}{formatCentavos(m.valorCentavos)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`/t/${slug}/financeiro/movimentacoes/nova?tipo=ENTRADA`}>
                  <Plus className="mr-2 h-4 w-4" />Recebimento
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={`/t/${slug}/financeiro/movimentacoes/nova?tipo=SAIDA`}>
                  <Plus className="mr-2 h-4 w-4" />Despesa
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Vencimentos próximos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vencimentos próximos</CardTitle>
            </CardHeader>
            <CardContent>
              {pendentes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum vencimento nos próximos 7 dias.</p>
              ) : (
                <div className="space-y-2">
                  {pendentes.map(p => (
                    <Link key={p.id} href={`/t/${slug}/financeiro/movimentacoes/${p.id}/editar`}
                      className="flex items-center justify-between gap-2 text-xs hover:opacity-80">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.descricao}</p>
                        {p.dataVencimento && (
                          <p className="text-muted-foreground">{p.dataVencimento.toLocaleDateString("pt-BR")}</p>
                        )}
                      </div>
                      <span className={p.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-600"}>
                        {formatCentavos(p.valorCentavos)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Contas bancárias</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href={`/t/${slug}/financeiro/contas`}>Gerenciar</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {contas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma conta cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {contas.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{c.nome}</p>
                        <p className="text-muted-foreground">{c.banco}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atalhos */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Relatórios</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/t/${slug}/financeiro/dre`}>
                  <BookOpen className="mr-2 h-4 w-4" />DRE Geral
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/t/${slug}/financeiro/dre`}>
                  <TrendingUp className="mr-2 h-4 w-4" />DRE por Veículo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
