import Link from "next/link";
import Image from "next/image";
import { Plus, Images, FolderOpen, List, SquareKanban, Car } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { cn, formatCentavos } from "@/lib/utils";
import { EstoqueAcoes } from "./estoque-acoes";
import { VeiculosKanban } from "./veiculos-kanban";
import { STAGE_CONFIG, STAGE_ORDER, type VeiculoResumo } from "./status";

export const metadata = { title: "Veículos" };

export default async function VeiculosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  const [{ slug }, filters, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);

  const view = filters.view === "lista" ? "lista" : "kanban";

  // STAFF usa tenantId da sessão; PLATAFORMA resolve via slug da URL.
  // Isso evita tenantId nulo quando um admin global abre /t/[slug]/veiculos.
  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(slug)).id
      : session.user.tenantId!;

  const where: any = { tenantId };
  // No kanban o filtro de status não se aplica (as colunas já separam)
  if (filters.status && view === "lista") where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { marca:  { contains: filters.q, mode: "insensitive" } },
      { modelo: { contains: filters.q, mode: "insensitive" } },
      { placa:  { contains: filters.q, mode: "insensitive" } },
      { versao: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.veiculo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
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
      dataChegada: true,
      // Miniatura: foto de destaque (fallback: primeira pela ordem)
      fotos: {
        orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
        take: 1,
        select: { url: true },
      },
      _count: { select: { fotos: true, documentos: true } },
    },
  });

  const veiculos: VeiculoResumo[] = rows.map((v) => ({
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    versao: v.versao,
    cor: v.cor,
    anoFabricacao: v.anoFabricacao,
    anoModelo: v.anoModelo,
    placa: v.placa,
    kmAtual: v.kmAtual,
    precoCustoCentavos: v.precoCustoCentavos,
    precoVendaCentavos: v.precoVendaCentavos,
    status: v.status,
    thumbUrl: v.fotos[0]?.url ?? null,
    fotosCount: v._count.fotos,
    documentosCount: v._count.documentos,
    dataChegada: v.dataChegada?.toISOString() ?? null,
  }));

  const contadores = veiculos.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  const baseQuery = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    for (const [k, val] of Object.entries(extra)) {
      if (val) q.set(k, val);
    }
    const s = q.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className={cn(view === "kanban" ? "flex h-full flex-col gap-4" : "space-y-6")}>
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground">
            {veiculos.length} veículo(s) exibido(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Lista / Kanban */}
          <div className="flex items-center rounded-full border bg-muted/40 p-1">
            <Link
              href={`/t/${slug}/veiculos${baseQuery({ view: "kanban" })}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                view === "kanban"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <SquareKanban className="h-3.5 w-3.5" />
              Painel
            </Link>
            <Link
              href={`/t/${slug}/veiculos${baseQuery({ view: "lista", status: filters.status })}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                view === "lista"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </Link>
          </div>
          <Button asChild>
            <Link href={`/t/${slug}/veiculos/novo`}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar veículo
            </Link>
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <VeiculosKanban slug={slug} veiculos={veiculos} className="flex-1 min-h-0" />
      ) : (
        <>
          {/* Filtros rápidos por status */}
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((s) => (
              <Link
                key={s}
                href={`/t/${slug}/veiculos${baseQuery({
                  status: filters.status === s ? undefined : s,
                })}`}
              >
                <Badge
                  variant={filters.status === s ? "default" : "outline"}
                  className="cursor-pointer gap-1.5 px-3 py-1 text-xs"
                >
                  {STAGE_CONFIG[s].label}
                  {contadores[s] != null && (
                    <span className="rounded-full bg-background/20 px-1.5 text-[10px]">
                      {contadores[s]}
                    </span>
                  )}
                </Badge>
              </Link>
            ))}
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
                        <th className="px-5 py-3 text-center">Pasta</th>
                        <th className="px-5 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {veiculos.map((v) => {
                        const cfg = STAGE_CONFIG[v.status] ?? STAGE_CONFIG.EM_PREPARACAO;
                        return (
                          <tr key={v.id} className="transition-colors hover:bg-muted/20">
                            <td className="px-5 py-3">
                              <Link
                                href={`/t/${slug}/veiculos/${v.id}/editar`}
                                className="group flex items-center gap-3"
                              >
                                {/* Miniatura (foto de destaque) */}
                                <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                  {v.thumbUrl ? (
                                    <Image
                                      src={v.thumbUrl}
                                      alt={`${v.marca} ${v.modelo}`}
                                      fill
                                      sizes="56px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <Car className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium group-hover:underline">
                                    {v.marca} {v.modelo}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {v.versao ?? v.cor ?? "—"}
                                  </div>
                                </div>
                              </Link>
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
                              <Badge variant={cfg.badge}>{cfg.label}</Badge>
                            </td>
                            {/* Pasta: fotos + documentos */}
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  href={`/t/${slug}/veiculos/${v.id}/fotos`}
                                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-blue-600"
                                  title="Fotos"
                                >
                                  <Images className="h-3.5 w-3.5" />
                                  {v.fotosCount}
                                </Link>
                                <Link
                                  href={`/t/${slug}/veiculos/${v.id}/arquivos`}
                                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-amber-600"
                                  title="Documentos"
                                >
                                  <FolderOpen className="h-3.5 w-3.5" />
                                  {v.documentosCount}
                                </Link>
                              </div>
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
        </>
      )}
    </div>
  );
}
