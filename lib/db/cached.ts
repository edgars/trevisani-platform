/**
 * Wrappers de cache para queries frequentes.
 *
 * unstable_cache: persiste entre requests no mesmo processo (servidor)
 * por até `revalidate` segundos. Ideal para dados que mudam pouco:
 * tenant, categorias financeiras, contas bancárias, listas de veículos.
 *
 * cache (React): deduplica chamadas dentro de um único render/tree.
 */
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "./client";

// ─── Tenant ──────────────────────────────────────────────────────────────────

export const getTenantBySlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({ where: { slug } });
});

export const getTenantById = cache(async (id: string) => {
  return prisma.tenant.findUnique({ where: { id } });
});

// ─── Categorias financeiras ───────────────────────────────────────────────────

export const getCategorias = unstable_cache(
  async (tenantId: string) =>
    prisma.categoriaFinanceira.findMany({
      where: { tenantId, ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
      include: { itens: { where: { ativo: true }, orderBy: { nome: "asc" } } },
    }),
  ["categorias-financeiras"],
  { revalidate: 60, tags: ["categorias"] },
);

// ─── Contas bancárias ──────────────────────────────────────────────────────────

export const getContasBancarias = unstable_cache(
  async (tenantId: string) =>
    prisma.contaBancaria.findMany({
      where: { tenantId, ativo: true },
      orderBy: { nome: "asc" },
    }),
  ["contas-bancarias"],
  { revalidate: 120, tags: ["contas"] },
);

// ─── Veículos (lista resumida para selects) ───────────────────────────────────

export const getVeiculosSelect = unstable_cache(
  async (tenantId: string) =>
    prisma.veiculo.findMany({
      where: { tenantId, status: { notIn: ["BAIXADO"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, marca: true, modelo: true, placa: true, anoModelo: true, status: true },
      take: 200,
    }),
  ["veiculos-select"],
  { revalidate: 30, tags: ["veiculos"] },
);

// ─── Clientes (lista resumida) ────────────────────────────────────────────────

export const getClientesSelect = unstable_cache(
  async (tenantId: string) =>
    prisma.clienteFinal.findMany({
      where: { tenantId, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, documento: true },
      take: 200,
    }),
  ["clientes-select"],
  { revalidate: 60, tags: ["clientes"] },
);

// ─── Fornecedores (lista resumida) ────────────────────────────────────────────

export const getFornecedoresSelect = unstable_cache(
  async (tenantId: string) =>
    prisma.fornecedor.findMany({
      where: { tenantId, ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
      take: 200,
    }),
  ["fornecedores-select"],
  { revalidate: 60, tags: ["fornecedores"] },
);
