import Link from "next/link";
import { TrendingUp, TrendingDown, Percent, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatCentavos, formatDate } from "@/lib/utils";

export const metadata = { title: "Financeiro da Plataforma" };
export const dynamic = "force-dynamic";

export default async function AdminFinanceiroPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, nome: true, slug: true, status: true,
      descontoPercent: true, createdAt: true,
      plano: { select: { nome: true, precoMensalCentavos: true, precoAnualCentavos: true } },
    },
  });

  const ativos     = tenants.filter(t => t.status === "ATIVO");
  const comDesconto = ativos.filter(t => t.descontoPercent > 0);

  const mrrBruto   = ativos.reduce((s, t) => s + (t.plano?.precoMensalCentavos ?? 0), 0);
  const mrrLiquido = ativos.reduce((s, t) => {
    const base = t.plano?.precoMensalCentavos ?? 0;
    return s + Math.round(base * (1 - t.descontoPercent / 100));
  }, 0);
  const totalDesconto = mrrBruto - mrrLiquido;
  const arrLiquido    = mrrLiquido * 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro da Plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Receita recorrente, descontos concedidos e situação financeira por tenant.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MRR Bruto</p>
            <p className="mt-2 text-2xl font-bold">{formatCentavos(mrrBruto)}</p>
            <p className="text-xs text-muted-foreground">{ativos.length} tenants ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MRR Líquido</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCentavos(mrrLiquido)}</p>
            <p className="text-xs text-muted-foreground">após descontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Descontos/mês</p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCentavos(totalDesconto)}</p>
            <p className="text-xs text-muted-foreground">{comDesconto.length} tenant(s) com desconto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ARR Líquido (est.)</p>
            <p className="mt-2 text-2xl font-bold">{formatCentavos(arrLiquido)}</p>
            <p className="text-xs text-muted-foreground">MRR × 12</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
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
                  const base     = t.plano?.precoMensalCentavos ?? 0;
                  const efetivo  = Math.round(base * (1 - t.descontoPercent / 100));
                  const economia = base - efetivo;
                  return (
                    <tr key={t.id} className={`hover:bg-muted/20 ${t.descontoPercent > 0 ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                      </td>
                      <td className="px-5 py-3">{t.plano?.nome ?? <span className="text-muted-foreground italic">Sem plano</span>}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={t.status === "ATIVO" ? "success" : t.status === "TRIAL" ? "warning" : "secondary"}
                        >
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
              {/* Footer totals */}
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

      {/* Tenants sem plano */}
      {tenants.some(t => !t.plano) && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <TrendingDown className="h-4 w-4" />
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
