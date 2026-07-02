import Link from "next/link";
import { Plus, Building2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { FornecedorAcoes } from "./fornecedor-acoes";

export const metadata = { title: "Fornecedores" };

function formatDoc(doc: string, tipo: string) {
  if (tipo === "PF" && doc.length === 11)
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (doc.length === 14)
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

export default async function FornecedoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; ativo?: string }>;
}) {
  const [{ slug }, filters, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);

  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(slug)).id
      : session.user.tenantId!;

  const ativoFilter =
    filters.ativo === "false" ? false : filters.ativo === "true" ? true : undefined;

  const where: any = { tenantId };
  if (ativoFilter !== undefined) where.ativo = ativoFilter;
  if (filters.q) {
    where.OR = [
      { nome:        { contains: filters.q, mode: "insensitive" } },
      { razaoSocial: { contains: filters.q, mode: "insensitive" } },
      { documento:   { contains: filters.q.replace(/\D/g, "") } },
      { email:       { contains: filters.q, mode: "insensitive" } },
      { cidade:      { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const fornecedores = await prisma.fornecedor.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      tipoPessoa: true,
      nome: true,
      razaoSocial: true,
      documento: true,
      email: true,
      telefone: true,
      cidade: true,
      estado: true,
      ativo: true,
      _count: { select: { compras: true } },
    },
  });

  const totalAtivos = fornecedores.filter((f) => f.ativo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {totalAtivos} ativo(s) · {fornecedores.length} total
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/fornecedores/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo fornecedor
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Todos", value: undefined },
          { label: "Ativos", value: "true" },
          { label: "Inativos", value: "false" },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={
              value === undefined
                ? `/t/${slug}/fornecedores${filters.q ? `?q=${filters.q}` : ""}`
                : `/t/${slug}/fornecedores?ativo=${value}${filters.q ? `&q=${filters.q}` : ""}`
            }
          >
            <Badge
              variant={filters.ativo === value || (value === undefined && !filters.ativo) ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {label}
            </Badge>
          </Link>
        ))}

        {/* Busca inline */}
        <form method="get" action={`/t/${slug}/fornecedores`} className="ml-auto">
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Buscar por nome, CNPJ, cidade…"
            className="h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-60"
          />
          {filters.ativo && <input type="hidden" name="ativo" value={filters.ativo} />}
        </form>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de fornecedores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fornecedores.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {filters.q || filters.ativo !== undefined
                  ? "Nenhum fornecedor encontrado com os filtros aplicados."
                  : 'Nenhum fornecedor cadastrado. Clique em "Novo fornecedor" para começar.'}
              </p>
              {(filters.q || filters.ativo) && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/t/${slug}/fornecedores`}>Limpar filtros</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Fornecedor</th>
                    <th className="px-5 py-3 text-left">Documento</th>
                    <th className="px-5 py-3 text-left">Contato</th>
                    <th className="px-5 py-3 text-left">Localidade</th>
                    <th className="px-5 py-3 text-center">Compras</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                            {f.tipoPessoa === "PJ" ? (
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{f.nome}</div>
                            {f.razaoSocial && (
                              <div className="text-xs text-muted-foreground">{f.razaoSocial}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {formatDoc(f.documento, f.tipoPessoa)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs">{f.email ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{f.telefone ?? ""}</div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {f.cidade && f.estado ? `${f.cidade} / ${f.estado}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-muted px-2 text-xs font-medium">
                          {f._count.compras}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={f.ativo ? "success" : "secondary"}>
                          {f.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <FornecedorAcoes
                          slug={slug}
                          fornecedorId={f.id}
                          ativo={f.ativo}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
