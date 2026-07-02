import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireWebsite } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marca?: string; precoMax?: string; anoMin?: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  return { title: `Estoque · ${tenant.nome}` };
}

export default async function EstoquePage({ params, searchParams }: Params) {
  const { slug } = await params;
  const filters = await searchParams;
  const tenant = await requireWebsite(slug);

  const marcaFilter = filters.marca?.trim() || undefined;
  const precoMaxFilter = filters.precoMax ? parseInt(filters.precoMax) * 100 : undefined;
  const anoMinFilter = filters.anoMin ? parseInt(filters.anoMin) : undefined;

  const veiculos = await prisma.veiculo.findMany({
    where: {
      tenantId: tenant.id,
      status: "DISPONIVEL",
      ...(marcaFilter ? { marca: { contains: marcaFilter, mode: "insensitive" } } : {}),
      ...(precoMaxFilter ? { precoVendaCentavos: { lte: precoMaxFilter } } : {}),
      ...(anoMinFilter ? { anoModelo: { gte: anoMinFilter } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      marca: true,
      modelo: true,
      versao: true,
      anoFabricacao: true,
      anoModelo: true,
      kmAtual: true,
      combustivel: true,
      cambio: true,
      cor: true,
      precoVendaCentavos: true,
      fotos: {
        where: { status: "PRONTO_VENDA" },
        orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });

  const marcas = await prisma.veiculo.groupBy({
    by: ["marca"],
    where: { tenantId: tenant.id, status: "DISPONIVEL" },
    orderBy: { marca: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Estoque disponível</h1>

      {/* Filtros */}
      <form
        method="GET"
        className="mb-8 flex flex-wrap gap-3 items-end rounded-xl border p-4 bg-neutral-50"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Marca</label>
          <select
            name="marca"
            defaultValue={marcaFilter ?? ""}
            className="rounded-md border px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m.marca} value={m.marca}>
                {m.marca}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Preço máx (R$)</label>
          <input
            type="number"
            name="precoMax"
            defaultValue={filters.precoMax ?? ""}
            placeholder="Ex: 80000"
            className="rounded-md border px-3 py-2 text-sm w-36 bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Ano mín</label>
          <input
            type="number"
            name="anoMin"
            defaultValue={filters.anoMin ?? ""}
            placeholder="Ex: 2020"
            className="rounded-md border px-3 py-2 text-sm w-28 bg-white"
          />
        </div>

        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "hsl(var(--site-primary))" }}
        >
          Filtrar
        </button>

        {(marcaFilter || filters.precoMax || filters.anoMin) && (
          <Link
            href="/estoque"
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
          >
            Limpar
          </Link>
        )}
      </form>

      {veiculos.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          Nenhum veículo encontrado com os filtros selecionados.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {veiculos.length} veículo{veiculos.length !== 1 ? "s" : ""} encontrado
            {veiculos.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {veiculos.map((v) => (
              <Link
                key={v.id}
                href={`/veiculo/${v.id}`}
                className="group rounded-xl border overflow-hidden transition-shadow hover:shadow-card-hover bg-white"
              >
                {v.fotos[0] ? (
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <Image
                      src={v.fotos[0].url}
                      alt={`${v.marca} ${v.modelo}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                    <span className="text-xs text-neutral-400">Sem foto</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-sm">
                    {v.marca} {v.modelo}
                    {v.versao ? ` ${v.versao}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.anoFabricacao}/{v.anoModelo}
                    {v.kmAtual != null ? ` · ${v.kmAtual.toLocaleString("pt-BR")} km` : ""}
                    {v.combustivel ? ` · ${v.combustivel}` : ""}
                  </p>
                  {v.precoVendaCentavos > 0 && (
                    <p
                      className="mt-2 font-bold"
                      style={{ color: "hsl(var(--site-accent))" }}
                    >
                      {formatCentavos(v.precoVendaCentavos)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
