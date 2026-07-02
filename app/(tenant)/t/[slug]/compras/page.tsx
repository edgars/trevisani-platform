import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos, formatDate } from "@/lib/utils";
import { CompraAcoes } from "./compra-acoes";

export const metadata = { title: "Compras" };

const STATUS_CONFIG = {
  RASCUNHO:               { label: "Rascunho",               variant: "secondary"   as const },
  AGUARDANDO_ASSINATURA:  { label: "Ag. assinatura",          variant: "warning"     as const },
  CONCLUIDA:              { label: "Concluída",               variant: "success"     as const },
  CANCELADA:              { label: "Cancelada",               variant: "destructive" as const },
};

export default async function ComprasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; fornecedorId?: string }>;
}) {
  const [{ slug }, filters, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);

  const tenantId = session.user.tenantId!;

  const where: any = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;

  const compras = await prisma.compra.findMany({
    where,
    orderBy: { numero: "desc" },
    take: 200,
    select: {
      id: true,
      numero: true,
      dataOperacao: true,
      status: true,
      valorTotalCentavos: true,
      observacoes: true,
      fornecedor: { select: { id: true, nome: true, razaoSocial: true } },
      itens: {
        select: {
          id: true,
          valorCentavos: true,
          veiculo: { select: { id: true, marca: true, modelo: true, placa: true, anoFabricacao: true, anoModelo: true } },
        },
      },
      pagamentos: { select: { id: true, valorCentavos: true } },
    },
  });

  const contadores = compras.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">
            {compras.length} compra(s) exibida(s)
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/compras/nova`}>
            <Plus className="mr-2 h-4 w-4" />
            Nova compra
          </Link>
        </Button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {(["RASCUNHO","AGUARDANDO_ASSINATURA","CONCLUIDA","CANCELADA"] as const).map((s) => (
          <Link
            key={s}
            href={
              filters.status === s
                ? `/t/${slug}/compras`
                : `/t/${slug}/compras?status=${s}`
            }
          >
            <Badge
              variant={filters.status === s ? "default" : "outline"}
              className="cursor-pointer gap-1.5 px-3 py-1 text-xs"
            >
              {STATUS_CONFIG[s].label}
              {contadores[s] != null && (
                <span className="rounded-full bg-background/20 px-1.5 text-[10px]">
                  {contadores[s]}
                </span>
              )}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro de compras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {compras.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {filters.status
                  ? "Nenhuma compra com este status."
                  : 'Nenhuma compra registrada. Clique em "Nova compra" para começar.'}
              </p>
              {filters.status && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/t/${slug}/compras`}>Limpar filtro</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Nº / Data</th>
                    <th className="px-5 py-3 text-left">Fornecedor</th>
                    <th className="px-5 py-3 text-left">Veículos</th>
                    <th className="px-5 py-3 text-right">Valor total</th>
                    <th className="px-5 py-3 text-right">Pago</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {compras.map((c) => {
                    const cfg = STATUS_CONFIG[c.status];
                    const totalPago = c.pagamentos.reduce((s, p) => s + p.valorCentavos, 0);
                    const saldo = c.valorTotalCentavos - totalPago;
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <Link
                            href={`/t/${slug}/compras/${c.id}`}
                            className="group"
                          >
                            <div className="font-medium group-hover:underline">
                              #{String(c.numero).padStart(4, "0")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(c.dataOperacao)}
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <Link href={`/t/${slug}/fornecedores/${c.fornecedor.id}/editar`} className="hover:underline">
                            <div className="font-medium">{c.fornecedor.nome}</div>
                            {c.fornecedor.razaoSocial && (
                              <div className="text-xs text-muted-foreground">{c.fornecedor.razaoSocial}</div>
                            )}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <div className="space-y-0.5">
                            {c.itens.map((item) => (
                              <div key={item.id} className="text-xs">
                                <span className="font-medium">
                                  {item.veiculo.marca} {item.veiculo.modelo}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}· {item.veiculo.anoFabricacao}/{item.veiculo.anoModelo}
                                  {item.veiculo.placa ? ` · ${item.veiculo.placa}` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatCentavos(c.valorTotalCentavos)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="text-xs">
                            {formatCentavos(totalPago)}
                          </div>
                          {saldo > 0 && (
                            <div className="text-[11px] text-destructive">
                              − {formatCentavos(saldo)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <CompraAcoes slug={slug} compraId={c.id} status={c.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
