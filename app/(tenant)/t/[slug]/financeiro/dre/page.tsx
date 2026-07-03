import Link from "next/link";
import { Car, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos } from "@/lib/utils";
import { DreVeiculoSelector } from "./dre-veiculo-selector";

export const metadata = { title: "DRE — Demonstrativo de Resultados" };

type Periodo = { de: Date; ate: Date; label: string };

function buildPeriodo(de?: string, ate?: string): Periodo {
  const now = new Date();
  const d = de  ? new Date(de)  : new Date(now.getFullYear(), now.getMonth(), 1);
  const a = ate ? new Date(ate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const label = `${d.toLocaleDateString("pt-BR")} – ${a.toLocaleDateString("pt-BR")}`;
  return { de: d, ate: a, label };
}

export default async function DrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ de?: string; ate?: string; veiculoId?: string }>;
}) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, requireSession()]);
  const tenantId = session.user.tenantId!;
  const periodo = buildPeriodo(sp.de, sp.ate);
  const veiculoId = sp.veiculoId;

  const whereMov = {
    tenantId,
    dataCompetencia: { gte: periodo.de, lte: periodo.ate },
    status: { not: "CANCELADO" as const },
    ...(veiculoId ? { veiculoId } : {}),
  };

  // ─── Dados do DRE ────────────────────────────────────────────────────────────

  const [movEntradas, movSaidas, veiculoInfo] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { ...whereMov, tipo: "ENTRADA" },
      include: { categoria: { select: { nome: true, cor: true } } },
    }),
    prisma.movimentacao.findMany({
      where: { ...whereMov, tipo: "SAIDA" },
      include: { categoria: { select: { nome: true, cor: true } } },
    }),
    veiculoId
      ? prisma.veiculo.findFirst({ where: { id: veiculoId, tenantId }, select: { marca: true, modelo: true, placa: true, anoModelo: true } })
      : null,
  ]);

  // Veículos disponíveis para filtro
  const veiculos = await prisma.veiculo.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: { id: true, marca: true, modelo: true, placa: true, anoModelo: true },
    take: 200,
  });

  // ─── Agrupamento por categoria ───────────────────────────────────────────────

  function agrupar(movs: typeof movEntradas) {
    const map = new Map<string, { nome: string; cor: string | null; total: number; count: number }>();
    for (const m of movs) {
      const key  = m.categoriaId ?? "__sem_categoria__";
      const nome = m.categoria?.nome ?? "Sem categoria";
      const cor  = m.categoria?.cor ?? null;
      const prev = map.get(key) ?? { nome, cor, total: 0, count: 0 };
      map.set(key, { ...prev, total: prev.total + m.valorCentavos, count: prev.count + 1 });
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  const gruposEntradas = agrupar(movEntradas);
  const gruposSaidas   = agrupar(movSaidas);

  const totalEntradas  = movEntradas.reduce((s, m) => s + m.valorCentavos, 0);
  const totalSaidas    = movSaidas.reduce((s, m)   => s + m.valorCentavos, 0);
  const resultadoLiq   = totalEntradas - totalSaidas;
  const margem         = totalEntradas > 0 ? (resultadoLiq / totalEntradas) * 100 : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  const titulo = veiculoInfo
    ? `DRE — ${veiculoInfo.marca} ${veiculoInfo.modelo} ${veiculoInfo.anoModelo}${veiculoInfo.placa ? ` (${veiculoInfo.placa})` : ""}`
    : "DRE — Demonstrativo de Resultados";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">Período: {periodo.label}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/t/${slug}/financeiro/movimentacoes`}>Ver movimentações</Link>
        </Button>
      </div>

      {/* Filtros */}
      <DreVeiculoSelector
        slug={slug}
        veiculos={veiculos.map(v => ({ id: v.id, label: `${v.marca} ${v.modelo} ${v.anoModelo}${v.placa ? ` — ${v.placa}` : ""}` }))}
        defaultDe={sp.de ?? ""}
        defaultAte={sp.ate ?? ""}
        defaultVeiculoId={veiculoId ?? ""}
      />

      {/* KPIs principais */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Receita Total",    value: totalEntradas,  icon: TrendingUp,   cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Custo / Despesas", value: totalSaidas,    icon: TrendingDown, cls: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/20" },
          { label: "Resultado Líquido",value: resultadoLiq,   icon: resultadoLiq >= 0 ? TrendingUp : TrendingDown,
            cls: resultadoLiq >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            bg:  resultadoLiq >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20"  : "bg-red-50 dark:bg-red-950/20" },
          { label: "Margem Líquida",   value: null, margem,   icon: null, cls: margem >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", bg: "bg-muted/40" },
        ].map(item => (
          <Card key={item.label} className={item.bg}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className={`mt-1 text-xl font-bold ${item.cls}`}>
                    {item.value !== null
                      ? `${item.value < 0 ? "-" : ""}${formatCentavos(Math.abs(item.value))}`
                      : `${margem.toFixed(1)}%`}
                  </p>
                </div>
                {item.icon && <item.icon className={`h-5 w-5 ${item.cls} opacity-60`} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receitas por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" /> Receitas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gruposEntradas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma receita no período.</p>
            ) : (
              <>
                {gruposEntradas.map(g => (
                  <div key={g.nome} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: g.cor ?? "#4ade80" }} />
                    <span className="flex-1 text-sm truncate">{g.nome}</span>
                    <Badge variant="outline" className="text-[10px]">{g.count}</Badge>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCentavos(g.total)}
                    </span>
                    <div className="w-16 bg-muted rounded-full h-1.5 shrink-0">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(g.total / totalEntradas) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCentavos(totalEntradas)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Despesas por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
              <TrendingDown className="h-4 w-4" /> Despesas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gruposSaidas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma despesa no período.</p>
            ) : (
              <>
                {gruposSaidas.map(g => (
                  <div key={g.nome} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: g.cor ?? "#f87171" }} />
                    <span className="flex-1 text-sm truncate">{g.nome}</span>
                    <Badge variant="outline" className="text-[10px]">{g.count}</Badge>
                    <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                      {formatCentavos(g.total)}
                    </span>
                    <div className="w-16 bg-muted rounded-full h-1.5 shrink-0">
                      <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${(g.total / totalSaidas) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-red-600 dark:text-red-400">{formatCentavos(totalSaidas)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DRE por Veículo (somente quando não está em modo de veículo específico) */}
      {!veiculoId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" /> DRE por Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione um veículo acima para visualizar o DRE individual,
              ou clique em um veículo abaixo para ver seu detalhamento:
            </p>
            <DreVeiculosLista slug={slug} tenantId={tenantId} periodo={periodo} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function DreVeiculosLista({
  slug,
  tenantId,
  periodo,
}: {
  slug: string;
  tenantId: string;
  periodo: Periodo;
}) {
  // Busca veículos que têm movimentações no período
  const veiculosComMov = await prisma.veiculo.findMany({
    where: {
      tenantId,
      movimentacoes: {
        some: {
          dataCompetencia: { gte: periodo.de, lte: periodo.ate },
          status: { not: "CANCELADO" },
        },
      },
    },
    include: {
      movimentacoes: {
        where: {
          dataCompetencia: { gte: periodo.de, lte: periodo.ate },
          status: { not: "CANCELADO" },
        },
        select: { tipo: true, valorCentavos: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  if (veiculosComMov.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum veículo com movimentações no período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-2 text-left">Veículo</th>
            <th className="py-2 text-right">Receitas</th>
            <th className="py-2 text-right">Despesas</th>
            <th className="py-2 text-right">Resultado</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {veiculosComMov.map(v => {
            const receita  = v.movimentacoes.filter(m => m.tipo === "ENTRADA").reduce((s, m) => s + m.valorCentavos, 0);
            const despesa  = v.movimentacoes.filter(m => m.tipo === "SAIDA").reduce((s, m)   => s + m.valorCentavos, 0);
            const resultado = receita - despesa;
            return (
              <tr key={v.id} className="hover:bg-muted/20">
                <td className="py-2.5">
                  <p className="font-medium">{v.marca} {v.modelo} {v.anoModelo}</p>
                  {v.placa && <p className="text-xs text-muted-foreground font-mono">{v.placa}</p>}
                </td>
                <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCentavos(receita)}</td>
                <td className="py-2.5 text-right text-red-600 dark:text-red-400 tabular-nums">{formatCentavos(despesa)}</td>
                <td className={`py-2.5 text-right font-bold tabular-nums ${resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {resultado >= 0 ? "+" : ""}{formatCentavos(resultado)}
                </td>
                <td className="py-2.5 text-right">
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link href={`/t/${slug}/financeiro/dre?veiculoId=${v.id}`}>Detalhar</Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
