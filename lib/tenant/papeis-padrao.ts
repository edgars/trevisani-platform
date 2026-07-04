// Papéis e permissões padrão criados automaticamente para todo novo tenant
// (seed de desenvolvimento e cadastro self-service via /cadastro).
//
// Recebe o client Prisma por parâmetro (em vez de importar o singleton de
// `@/lib/db/client`) para que o script de seed possa reutilizar sua própria
// instância — evitar dois PrismaClients concorrentes no mesmo processo, o
// que pode gerar contenção com o pooler (PgBouncer/Supavisor) do Supabase.

import type { PrismaClient } from "@prisma/client";

export const PERMISSOES_BASE = [
  // Tenant admin
  { slug: "tenant.gerenciar", modulo: "tenant", acao: "gerenciar" },
  { slug: "usuario.gerenciar", modulo: "usuario", acao: "gerenciar" },
  { slug: "papel.gerenciar", modulo: "papel", acao: "gerenciar" },
  { slug: "integracao.gerenciar", modulo: "integracao", acao: "gerenciar" },
  // Estoque
  { slug: "veiculo.criar", modulo: "veiculo", acao: "criar" },
  { slug: "veiculo.editar", modulo: "veiculo", acao: "editar" },
  { slug: "veiculo.remover", modulo: "veiculo", acao: "remover" },
  { slug: "veiculo.listar", modulo: "veiculo", acao: "listar" },
  // Compras
  { slug: "compra.criar", modulo: "compra", acao: "criar" },
  { slug: "compra.aprovar", modulo: "compra", acao: "aprovar" },
  { slug: "compra.listar", modulo: "compra", acao: "listar" },
  // Vendas
  { slug: "venda.criar", modulo: "venda", acao: "criar" },
  { slug: "venda.aprovar", modulo: "venda", acao: "aprovar" },
  { slug: "venda.listar", modulo: "venda", acao: "listar" },
  // Financeiro
  { slug: "financeiro.gerenciar", modulo: "financeiro", acao: "gerenciar" },
  { slug: "financeiro.visualizar", modulo: "financeiro", acao: "visualizar" },
  // Ofertas (fornecedor)
  { slug: "oferta.criar", modulo: "oferta", acao: "criar" },
  { slug: "oferta.listar", modulo: "oferta", acao: "listar" },
  // Documentos
  { slug: "documento.gerar", modulo: "documento", acao: "gerar" },
  { slug: "documento.assinar", modulo: "documento", acao: "assinar" },
] as const;

export const PAPEIS_PADRAO: Array<{
  slug: string;
  nome: string;
  descricao: string;
  permissoes: string[];
}> = [
  {
    slug: "admin",
    nome: "Administrador",
    descricao: "Acesso total ao tenant.",
    permissoes: PERMISSOES_BASE.map((p) => p.slug),
  },
  {
    slug: "vendedor",
    nome: "Vendedor",
    descricao: "Cria propostas e vendas, consulta estoque.",
    permissoes: [
      "veiculo.listar",
      "venda.criar",
      "venda.listar",
      "documento.gerar",
      "financeiro.visualizar",
    ],
  },
  {
    slug: "comprador",
    nome: "Comprador",
    descricao: "Analisa ofertas de fornecedores e registra compras.",
    permissoes: [
      "veiculo.criar",
      "veiculo.editar",
      "veiculo.listar",
      "oferta.listar",
      "compra.criar",
      "compra.aprovar",
      "compra.listar",
    ],
  },
  {
    slug: "financeiro",
    nome: "Financeiro",
    descricao: "Gestão de pagamentos, despesas e conciliação.",
    permissoes: ["financeiro.gerenciar", "financeiro.visualizar"],
  },
];

/** Garante que as permissões globais (`Permissao`) existem. Idempotente. */
export async function garantirPermissoesBase(db: PrismaClient): Promise<void> {
  for (const p of PERMISSOES_BASE) {
    await db.permissao.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
}

/**
 * Cria os papéis padrão (admin, vendedor, comprador, financeiro) para um
 * tenant novo e retorna o papel "admin" já criado, para atribuição imediata
 * ao usuário responsável pelo cadastro.
 */
export async function provisionarPapeisPadraoTenant(db: PrismaClient, tenantId: string) {
  let papelAdmin: { id: string } | null = null;

  for (const p of PAPEIS_PADRAO) {
    const papel = await db.papel.upsert({
      where: { tenantId_slug: { tenantId, slug: p.slug } },
      update: { nome: p.nome, descricao: p.descricao, sistemico: true },
      create: {
        tenantId,
        slug: p.slug,
        nome: p.nome,
        descricao: p.descricao,
        sistemico: true,
      },
    });

    if (p.slug === "admin") papelAdmin = papel;

    for (const permSlug of p.permissoes) {
      const permissao = await db.permissao.findUnique({ where: { slug: permSlug } });
      if (permissao) {
        await db.papelPermissao.upsert({
          where: { papelId_permissaoId: { papelId: papel.id, permissaoId: permissao.id } },
          update: {},
          create: { papelId: papel.id, permissaoId: permissao.id },
        });
      }
    }
  }

  return { papelAdmin };
}
