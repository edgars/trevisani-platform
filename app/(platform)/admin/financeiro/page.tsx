import Link from "next/link";
import { Building2, Percent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatCentavos, formatDate } from "@/lib/utils";
import { DreMesesNav } from "./dre-meses-nav";

export const metadata = { title: "Financeiro da Plataforma" };
export const dynamic = "force-dynamic";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function fmt(v: number, showSign = false) {
  const s = formatCentavos(Math.abs(v));
  if (showSign && v > 0) return `+${s}`;
  if (v < 0) return `−${s}`;
  return s;
}

interface DRERow {
  label: string;
  sub?: string;
  valor: number;
  indent?: number;
  bold?: boolean;
  separator?: boolean;
}

function DRETable({ rows }: { rows: DRERow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="py-2 text-left">Linha</th>
            <th className="py-2 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            if (r.separator) return <tr key={i}><td colSpan={2} className="h-2" /></tr>;
            return (
              <tr key={i} className={`border-b border-border/40 ${r.bold ? "bg-muted/30 font-semibold" : "hover:bg-muted/20"}`}>
                <td className={`py-2 ${r.indent ? `pl-${r.indent * 4}` : ""}`}>
                  <span className={r.bold ? "" : "text-muted-foreground"}>{r.label}</span>
                  {r.sub && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">{r.sub}</span>}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {r.valor !== 0 || r.bold ? fmt(r.valor) : <span className="text-muted-foreground/40">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; regime?: "caixa" | "competencia" }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const ano = parseInt(sp.ano ?? String(now.getFullYear()), 10);
  const mes = parseInt(sp.mes ?? String(now.getMonth() + 1), 10);
  const regime = sp.regime ?? "competencia";

  const periodoInicio = new Date(ano, mes - 1, 1);
  const periodoFim = new Date(ano, mes, 0, 23, 59, 59);

  const statusFilter = regime === "caixa"
    ? { status: "PAGO" as const }
    : { status: { not: "CANCELADO" as const } };

  const [tenants, movEntradas, movSaidas] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nome: true, slug: true, status: true,
        descontoPercent: true, createdAt: true,
        plano: { select: { nome: true, precoMensalCentavos: true, precoAnualCentavos: true } },
      },
    }),
    prisma.movimentacaoPlataforma.findMany({
      where: { tipo: "ENTRADA", dataCompetencia: { gte: periodoInicio, lte: periodoFim }, ...statusFilter },
    }),
    prisma.movimentacaoPlataforma.findMany({
      where: { tipo: "SAIDA", dataCompetencia: { gte: periodoInicio, lte: periodoFim }, ...statusFilter },
    }),
  ]);

  const ativos = tenants.filter(t => t.status === "ATIVO");
  const comDesconto = ativos.filter(t => t.descontoPercent > 0);

  const mrrBruto = ativos.reduce((s, t) => s + (t.plano?.precoMensalCentavos ?? 0), 0);
  const mrrLiquido = ativos.reduce((s, t) => {
    const base = t.plano?.precoMensalCentavos ?? 0;
    return s + Math.round(base * (1 - t.descontoPercent / 100));
  }, 0);
  const totalDesconto = mrrBruto - mrrLiquido;
  const arrLiquido = mrrLiquido * 12;

  // ─── DRE do período (movimentações manuais + MRR recorrente) ────────────────
  const outrasReceitas = movEntradas.reduce((s, m) => s + m.valorCentavos, 0);
  const receitaTotal = mrrLiquido + outrasReceitas;

  const despesasPorCat = new Map<string, number>();
  for (const m of movSaidas) {
    const key = m.categoria ?? "Sem categoria";
    despesasPorCat.set(key, (despesasPorCat.get(key) ?? 0) + m.valorCentavos);
  }
  const totalDespesas = movSaidas.reduce((s, m) => s + m.valorCentavos, 0);
  const resultado = receitaTotal - totalDespesas;

  const dreRows: DRERow[] = [
    { label: "(+) Receita de Assinaturas (MRR líquido)", valor: mrrLiquido, sub: `${ativos.length} tenant(s) ativos` },
    { label: "(+) Outras Receitas (movimentações)", valor: outrasReceitas },
    { label: "= Receita Total", valor: receitaTotal, bold: true },
    { separator: true, label: "", valor: 0 },
    { label: "(−) Despesas Operacionais", valor: -totalDespesas, bold: true },
    ...[...despesasPorCat.entries()].map(([nome, total]) => ({ label: nome, valor: -total, indent: 1 })),
    { separator: true, label: "", valor: 0 },
    { label: "= Resultado do Período", valor: resultado, bold: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header + period nav */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">DRE — {MESES[mes - 1]} {ano}</h2>
          <p className="text-sm text-muted-foreground">
            Regime: <strong>{regime === "caixa" ? "Caixa (somente pagos)" : "Competência (todos)"}</strong>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`?ano=${ano}&mes=${mes}&regime=${regime === "caixa" ? "competencia" : "caixa"}`}>
            {regime === "caixa" ? "Ver competência" : "Ver caixa"}
          </Link>
        </Button>
      </div>

      <DreMesesNav ano={ano} mes={mes} regime={regime} />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MRR Líquido</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCentavos(mrrLiquido)}</p>
            <p className="text-xs text-muted-foreground">ARR est.: {formatCentavos(arrLiquido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Receita Total do mês</p>
            <p className="mt-2 text-2xl font-bold">{formatCentavos(receitaTotal)}</p>
            <p className="text-xs text-muted-foreground">MRR + outras receitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Despesas do mês</p>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{formatCentavos(totalDespesas)}</p>
            <p className="text-xs text-muted-foreground">{movSaidas.length} movimentação(ões)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resultado do mês</p>
            <p className={`mt-2 text-2xl font-bold ${resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {fmt(resultado, true)}
            </p>
            <p className="text-xs text-muted-foreground">Receita total − despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demonstrativo de Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <DRETable rows={dreRows} />
        </CardContent>
      </Card>

      {/* Table de cobrança por tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Cobrança por tenant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Tenant</th>
                  <th className="px-5 py-3 text-left">Plano</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Preço tabela</th>
                  <th className="px-5 py-3 text-right">Desconto</th>
                  <th className="px-5 py-3 text-right">MRR efetivo</th>
                  <th className="px-5 py-3 text-left">Cliente desde</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map(t => {
                  const base = t.plano?.precoMensalCentavos ?? 0;
                  const efetivo = Math.round(base * (1 - t.descontoPercent / 100));
                  const economia = base - efetivo;
                  return (
                    <tr key={t.id} className={`hover:bg-muted/20 ${t.descontoPercent > 0 ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                      </td>
                      <td className="px-5 py-3">{t.plano?.nome ?? <span className="text-muted-foreground italic">Sem plano</span>}</td>
                      <td className="px-5 py-3">
                        <Badge variant={t.status === "ATIVO" ? "success" : t.status === "TRIAL" ? "warning" : "secondary"}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {base > 0 ? formatCentavos(base) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {t.descontoPercent > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                            <Percent className="h-3 w-3" />{t.descontoPercent}%
                            {economia > 0 && (
                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                (−{formatCentavos(economia)})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {base > 0 ? (
                          <span className={`font-semibold ${efetivo === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                            {efetivo === 0 ? "Gratuito" : formatCentavos(efetivo)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/admin/tenants/${t.id}`}>Editar</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t bg-muted/30 font-semibold text-sm">
                <tr>
                  <td className="px-5 py-3" colSpan={3}>Total ({ativos.length} ativos)</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{formatCentavos(mrrBruto)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                    {totalDesconto > 0 ? `−${formatCentavos(totalDesconto)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCentavos(mrrLiquido)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {tenants.some(t => !t.plano) && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              Tenants sem plano ({tenants.filter(t => !t.plano).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tenants.filter(t => !t.plano).map(t => (
                <Button key={t.id} asChild variant="outline" size="sm">
                  <Link href={`/admin/tenants/${t.id}`}>
                    {t.nome} <span className="ml-1 text-xs text-muted-foreground">({t.slug})</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
