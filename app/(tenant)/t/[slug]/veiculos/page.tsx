import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos } from "@/lib/utils";
import { EstoqueAcoes } from "./estoque-acoes";

export const metadata = { title: "Estoque" };

const STATUS_CONFIG = {
  DISPONIVEL:    { label: "Disponível",    variant: "success"     as const },
  RESERVADO:     { label: "Reservado",     variant: "warning"     as const },
  VENDIDO:       { label: "Vendido",       variant: "secondary"   as const },
  EM_PREPARACAO: { label: "Em preparação", variant: "secondary"   as const },
  BAIXADO:       { label: "Baixado",       variant: "destructive" as const },
};

export default async function EstoquePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ slug }, filters, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);

  // Usa tenantId da sessão JWT — sem round-trip extra ao banco
  const tenantId = session.user.tenantId!;

  const where: any = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { marca:  { contains: filters.q, mode: "insensitive" } },
      { modelo: { contains: filters.q, mode: "insensitive" } },
      { placa:  { contains: filters.q, mode: "insensitive" } },
      { versao: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  // 1 única query — contadores calculados do array retornado
  const veiculos = await prisma.veiculo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      marca: true,
      modelo: true,
      versao: true,
      cor: true,
      anoFabricacao: true,
      anoModelo: true,
      placa: true,
      kmAtual: true,
      precoCustoCentavos: true,
      precoVendaCentavos: true,
      status: true,
    },
  });

  // Contadores por status calculados em memória (sem segundo round-trip)
  const contadores = veiculos.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque de veículos</h1>
          <p className="text-sm text-muted-foreground">
            {veiculos.length} veículo(s) exibido(s)
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/veiculos/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar veículo
          </Link>
        </Button>
      </div>

      {/* Filtros rápidos por status */}
      <div className="flex flex-wrap gap-2">
        {(["DISPONIVEL", "EM_PREPARACAO", "RESERVADO", "VENDIDO", "BAIXADO"] as const).map(
          (s) => (
            <Link
              key={s}
              href={
                filters.status === s
                  ? `/t/${slug}/veiculos`
                  : `/t/${slug}/veiculos?status=${s}`
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
          ),
        )}
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Veículos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {veiculos.length === 0 ? (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {filters.status || filters.q
                  ? "Nenhum veículo encontrado com os filtros aplicados."
                  : 'Nenhum veículo cadastrado. Clique em "Cadastrar veículo" para começar.'}
              </p>
              {(filters.status || filters.q) && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/t/${slug}/veiculos`}>Limpar filtros</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Veículo</th>
                    <th className="px-5 py-3 text-left">Ano</th>
                    <th className="px-5 py-3 text-left">Placa</th>
                    <th className="px-5 py-3 text-left">KM</th>
                    <th className="px-5 py-3 text-right">Custo</th>
                    <th className="px-5 py-3 text-right">Venda</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {veiculos.map((v) => {
                    const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.EM_PREPARACAO;
                    return (
                      <tr key={v.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-5 py-3">
                          <div className="font-medium">
                            {v.marca} {v.modelo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {v.versao ?? v.cor ?? "—"}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {v.anoFabricacao}/{v.anoModelo}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {v.placa ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {v.kmAtual != null
                            ? `${v.kmAtual.toLocaleString("pt-BR")} km`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground">
                          {formatCentavos(v.precoCustoCentavos)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatCentavos(v.precoVendaCentavos)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <EstoqueAcoes
                            slug={slug}
                            veiculoId={v.id}
                            statusAtual={v.status}
                          />
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
