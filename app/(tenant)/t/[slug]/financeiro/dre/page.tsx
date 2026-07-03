import Link from "next/link";
import { Car, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos } from "@/lib/utils";
import { DreMesesNav } from "./dre-meses-nav";
import type { LinhaOrcamento } from "../orcamento/actions";

export const metadata = { title: "DRE — Demonstrativo de Resultados" };
export const dynamic = "force-dynamic";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(v: number, showSign = false) {
  const s = formatCentavos(Math.abs(v));
  if (showSign && v > 0)  return `+${s}`;
  if (v < 0)              return `−${s}`;
  return s;
}

function varianceCls(delta: number) {
  if (delta > 0)  return "text-emerald-600 dark:text-emerald-400";
  if (delta < 0)  return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

interface DRERow {
  label:     string;
  sub?:      string;
  planejado: number;
  realizado: number;
  indent?:   number;
  bold?:     boolean;
  separator?: boolean;
}

function DRETable({ rows }: { rows: DRERow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="py-2 text-left">Linha</th>
            <th className="py-2 pr-4 text-right">Planejado</th>
            <th className="py-2 pr-4 text-right">Realizado</th>
            <th className="py-2 text-right">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            if (r.separator) return <tr key={i}><td colSpan={4} className="h-2" /></tr>;
            const delta = r.realizado - r.planejado;
            return (
              <tr key={i} className={`border-b border-border/40 ${r.bold ? "bg-muted/30 font-semibold" : "hover:bg-muted/20"}`}>
                <td className={`py-2 ${r.indent ? `pl-${(r.indent * 4)}` : ""}`}>
                  <span className={r.bold ? "" : "text-muted-foreground"}>
                    {r.label}
                  </span>
                  {r.sub && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">{r.sub}</span>}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {r.planejado !== 0 || r.bold ? fmt(r.planejado) : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {r.realizado !== 0 || r.bold ? fmt(r.realizado) : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className={`py-2 text-right tabular-nums ${varianceCls(delta)}`}>
                  {delta !== 0 ? fmt(delta, true) : <span className="text-muted-foreground/40">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function DrePage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ ano?: string; mes?: string; regime?: "caixa" | "competencia"; veiculoId?: string }>;
}) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, requireSession()]);
  const tenantId = session.user.tenantId!;

  const now = new Date();
  const ano = parseInt(sp.ano ?? String(now.getFullYear()), 10);
  const mes = parseInt(sp.mes ?? String(now.getMonth() + 1), 10);
  const regime = sp.regime ?? "caixa";
  const veiculoId = sp.veiculoId;

  const periodoInicio = new Date(ano, mes - 1, 1);
  const periodoFim    = new Date(ano, mes,     0, 23, 59, 59);

  const statusFilter = regime === "caixa"
    ? { status: "PAGO" as const }
    : { status: { not: "CANCELADO" as const } };

  const [configFiscal, orcamento, movEntradas, movSaidas, veiculoInfo, veiculosComMov] = await Promise.all([
    prisma.configuracaoFiscal.findUnique({ where: { tenantId } }),
    prisma.orcamentoMensal.findUnique({ where: { tenantId_ano_mes: { tenantId, ano, mes } } }),
    prisma.movimentacao.findMany({
      where: { tenantId, tipo: "ENTRADA", dataCompetencia: { gte: periodoInicio, lte: periodoFim }, ...statusFilter, ...(veiculoId ? { veiculoId } : {}) },
      include: { categoria: { select: { id: true, nome: true, cor: true } } },
    }),
    prisma.movimentacao.findMany({
      where: { tenantId, tipo: "SAIDA",   dataCompetencia: { gte: periodoInicio, lte: periodoFim }, ...statusFilter, ...(veiculoId ? { veiculoId } : {}) },
      include: { categoria: { select: { id: true, nome: true, cor: true } } },
    }),
    veiculoId ? prisma.veiculo.findFirst({ where: { id: veiculoId, tenantId }, select: { marca: true, modelo: true, placa: true, anoModelo: true } }) : null,
    !veiculoId ? prisma.veiculo.findMany({
      where: { tenantId, movimentacoes: { some: { dataCompetencia: { gte: periodoInicio, lte: periodoFim }, status: { not: "CANCELADO" } } } },
      include: { movimentacoes: { where: { dataCompetencia: { gte: periodoInicio, lte: periodoFim }, status: { not: "CANCELADO" } }, select: { tipo: true, valorCentavos: true } } },
      orderBy: { updatedAt: "desc" }, take: 50,
    }) : Promise.resolve([]),
  ]);

  // ─── Alíquota e overhead ──────────────────────────────────────────────────
  const aliquotaPct = orcamento?.aliquotaOverridesPct
    ? Number(orcamento.aliquotaOverridesPct)
    : configFiscal ? Number(configFiscal.aliquotaImpostosPct) : 0;

  const overheadR = orcamento?.overheadOverrideCentavos !== null && orcamento?.overheadOverrideCentavos !== undefined
    ? orcamento.overheadOverrideCentavos
    : configFiscal?.overheadMensalCentavos ?? 0;

  // ─── Realizado ────────────────────────────────────────────────────────────
  const receitaBrutaR = movEntradas.reduce((s, m) => s + m.valorCentavos, 0);
  const impostosR     = Math.round(receitaBrutaR * aliquotaPct / 100);
  const receitaLiqR   = receitaBrutaR - impostosR;

  const despesasPorCatR = new Map<string, { nome: string; cor: string | null; total: number }>();
  for (const m of movSaidas) {
    const key  = m.categoriaId ?? "__sem__";
    const nome = m.categoria?.nome ?? "Sem categoria";
    const prev = despesasPorCatR.get(key) ?? { nome, cor: m.categoria?.cor ?? null, total: 0 };
    despesasPorCatR.set(key, { ...prev, total: prev.total + m.valorCentavos });
  }
  const totalDespesasR = movSaidas.reduce((s, m) => s + m.valorCentavos, 0);
  const resultadoR     = receitaLiqR - totalDespesasR - overheadR;

  // ─── Planejado ────────────────────────────────────────────────────────────
  const receitasP: LinhaOrcamento[] = orcamento ? (orcamento.receitasJson as unknown as LinhaOrcamento[]) : [];
  const despesasP: LinhaOrcamento[] = orcamento ? (orcamento.despesasJson as unknown as LinhaOrcamento[]) : [];

  const receitaBrutaP = receitasP.reduce((s, l) => s + l.valorCentavos, 0);
  const impostosP     = Math.round(receitaBrutaP * aliquotaPct / 100);
  const receitaLiqP   = receitaBrutaP - impostosP;
  const totalDespesasP = despesasP.reduce((s, l) => s + l.valorCentavos, 0);

  const overheadP  = orcamento?.overheadOverrideCentavos ?? configFiscal?.overheadMensalCentavos ?? 0;
  const resultadoP = receitaLiqP - totalDespesasP - overheadP;

  // ─── Montar linhas do DRE ─────────────────────────────────────────────────
  // Unifica categorias de despesa (planejado + realizado)
  const catDesp = new Map<string, { nome: string; planejado: number; realizado: number }>();
  for (const l of despesasP) {
    const key = l.categoriaId ?? l.descricao;
    const prev = catDesp.get(key) ?? { nome: l.descricao, planejado: 0, realizado: 0 };
    catDesp.set(key, { ...prev, planejado: prev.planejado + l.valorCentavos });
  }
  for (const [k, v] of despesasPorCatR.entries()) {
    const prev = catDesp.get(k) ?? { nome: v.nome, planejado: 0, realizado: 0 };
    catDesp.set(k, { ...prev, nome: v.nome, realizado: prev.realizado + v.total });
  }

  const dreRows: DRERow[] = [
    { label: "(+) Receita Bruta",         planejado: receitaBrutaP, realizado: receitaBrutaR, bold: true },
    { label: "(−) Impostos / Deduções",   planejado: -impostosP,    realizado: -impostosR,    indent: 1,
      sub: `${aliquotaPct.toFixed(1)}% · ${configFiscal?.regimeTributario ?? "—"}` },
    { label: "= Receita Líquida",         planejado: receitaLiqP,   realizado: receitaLiqR,   bold: true },
    { separator: true, label: "", planejado: 0, realizado: 0 },
    { label: "(−) Despesas Operacionais", planejado: -totalDespesasP, realizado: -totalDespesasR, bold: true },
    ...[...catDesp.values()].map(c => ({
      label: c.nome, planejado: -c.planejado, realizado: -c.realizado, indent: 1,
    })),
    { label: "(−) Overhead Fixo",         planejado: -overheadP,   realizado: -overheadR,    indent: 1, sub: "fixo mensal" },
    { separator: true, label: "", planejado: 0, realizado: 0 },
    { label: "= Resultado do Período",    planejado: resultadoP,   realizado: resultadoR,    bold: true },
  ];

  const titulo = veiculoInfo
    ? `${veiculoInfo.marca} ${veiculoInfo.modelo} ${veiculoInfo.anoModelo}${veiculoInfo.placa ? ` · ${veiculoInfo.placa}` : ""}`
    : `${MESES[mes - 1]} ${ano}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">DRE Comparativo — {titulo}</h2>
          <p className="text-sm text-muted-foreground">
            Regime: <strong>{regime === "caixa" ? "Caixa (somente pagos)" : "Competência (todos)"}</strong>
            {!orcamento && " · Sem orçamento planejado para este mês"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/${slug}/financeiro/orcamento?ano=${ano}&mes=${mes}`}>Editar orçamento</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`?ano=${ano}&mes=${mes}&regime=${regime === "caixa" ? "competencia" : "caixa"}${veiculoId ? `&veiculoId=${veiculoId}` : ""}`}>
              {regime === "caixa" ? "Ver competência" : "Ver caixa"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Month nav */}
      <DreMesesNav ano={ano} mes={mes} slug={slug} regime={regime} veiculoId={veiculoId} />

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Receita Bruta",          plan: receitaBrutaP, real: receitaBrutaR },
          { label: "Impostos",               plan: impostosP,     real: impostosR     },
          { label: "Despesas + Overhead",    plan: totalDespesasP + overheadP, real: totalDespesasR + overheadR },
          { label: "Resultado",              plan: resultadoP,    real: resultadoR    },
        ].map(k => {
          const delta = k.real - k.plan;
          const isResult = k.label === "Resultado";
          const goodDelta = isResult ? delta >= 0 : delta <= 0;
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Planejado</span>
                    <span className="tabular-nums text-sm">{fmt(k.plan)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Realizado</span>
                    <span className="tabular-nums text-sm font-semibold">{fmt(k.real)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-1">
                    <span className="text-xs text-muted-foreground">Δ variação</span>
                    <span className={`tabular-nums text-xs font-semibold ${goodDelta ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {fmt(delta, true)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demonstrativo de Resultados</CardTitle>
          {!orcamento && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Coluna &ldquo;Planejado&rdquo; vazia — crie um orçamento para este mês para ver a comparação.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <DRETable rows={dreRows} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Margem Bruta Plan.", value: receitaBrutaP > 0 ? (receitaLiqP / receitaBrutaP * 100).toFixed(1) + "%" : "—" },
              { label: "Margem Bruta Real.", value: receitaBrutaR > 0 ? (receitaLiqR / receitaBrutaR * 100).toFixed(1) + "%" : "—" },
              { label: "Margem Liq. Plan.",  value: receitaBrutaP > 0 ? (resultadoP  / receitaBrutaP * 100).toFixed(1) + "%" : "—" },
              { label: "Margem Liq. Real.",  value: receitaBrutaR > 0 ? (resultadoR  / receitaBrutaR * 100).toFixed(1) + "%" : "—" },
            ].map(m => (
              <div key={m.label} className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-sm font-semibold">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DRE por Veículo */}
      {!veiculoId && veiculosComMov.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />DRE por Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Veículo</th>
                    <th className="px-4 py-2 text-right">Receitas</th>
                    <th className="px-4 py-2 text-right">Despesas</th>
                    <th className="px-4 py-2 text-right">Resultado</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {veiculosComMov.map(v => {
                    const rec = v.movimentacoes.filter(m => m.tipo === "ENTRADA").reduce((s, m) => s + m.valorCentavos, 0);
                    const des = v.movimentacoes.filter(m => m.tipo === "SAIDA").reduce((s, m)   => s + m.valorCentavos, 0);
                    const res = rec - des;
                    return (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{v.marca} {v.modelo} {v.anoModelo}</p>
                          {v.placa && <p className="text-xs text-muted-foreground font-mono">{v.placa}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCentavos(rec)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">{formatCentavos(des)}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${res >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {res >= 0 ? "+" : "−"}{formatCentavos(Math.abs(res))}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href={`?ano=${ano}&mes=${mes}&veiculoId=${v.id}`}>
                              Detalhar <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
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
