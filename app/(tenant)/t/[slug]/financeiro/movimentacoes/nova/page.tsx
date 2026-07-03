import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { getCategorias, getContasBancarias, getClientesSelect, getFornecedoresSelect, getVeiculosSelect } from "@/lib/db/cached";
import { MovimentacaoForm } from "./movimentacao-form";

export const metadata = { title: "Nova Movimentação" };

export default async function NovaMovimentacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; veiculoId?: string }>;
}) {
  const [{ slug }, sp, session] = await Promise.all([params, searchParams, requireSession()]);
  const tenantId = session.user.tenantId!;

  const [categorias, contas, clientes, fornecedores, veiculos] = await Promise.all([
    getCategorias(tenantId),
    getContasBancarias(tenantId),
    getClientesSelect(tenantId),
    getFornecedoresSelect(tenantId),
    getVeiculosSelect(tenantId),
  ]);

  const defaultTipo = (sp.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA") as "ENTRADA" | "SAIDA";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Link href={`/t/${slug}/financeiro/movimentacoes`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nova movimentação</h1>
          <p className="text-sm text-muted-foreground">Registre uma entrada ou saída financeira.</p>
        </div>
      </div>
      <MovimentacaoForm
        slug={slug}
        defaultTipo={defaultTipo}
        ctx={{
          categorias: categorias.map(c => ({
            id: c.id, nome: c.nome, tipo: c.tipo as "ENTRADA" | "SAIDA", cor: c.cor,
            itens: c.itens.map(i => ({ id: i.id, nome: i.nome })),
          })),
          contas: contas.map(c => ({ id: c.id, nome: c.nome, banco: c.banco })),
          clientes: clientes.map(c => ({ id: c.id, nome: c.nome })),
          fornecedores: fornecedores,
          veiculos: veiculos.map(v => ({
            id: v.id,
            label: `${v.marca} ${v.modelo} ${v.anoModelo}${v.placa ? ` — ${v.placa}` : ""}`,
          })),
        }}
      />
    </div>
  );
}
