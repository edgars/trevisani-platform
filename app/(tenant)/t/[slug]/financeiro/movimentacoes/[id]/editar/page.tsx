import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { getCategorias, getContasBancarias, getClientesSelect, getFornecedoresSelect, getVeiculosSelect } from "@/lib/db/cached";
import { MovimentacaoForm } from "../../nova/movimentacao-form";
import { ExcluirMovimentacaoButton } from "./excluir-button";

export const metadata = { title: "Editar Movimentação" };

export default async function EditarMovimentacaoPage({
  params,
}: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const [mov, categorias, contas, clientes, fornecedores, veiculos] = await Promise.all([
    prisma.movimentacao.findFirst({
      where: { id, tenantId },
      include: { anexos: { orderBy: { createdAt: "desc" } } },
    }),
    getCategorias(tenantId),
    getContasBancarias(tenantId),
    getClientesSelect(tenantId),
    getFornecedoresSelect(tenantId),
    getVeiculosSelect(tenantId),
  ]);

  if (!mov) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Link href={`/t/${slug}/financeiro/movimentacoes`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight truncate max-w-[400px]">{mov.descricao}</h1>
            <p className="text-sm text-muted-foreground">Editar movimentação</p>
          </div>
        </div>
        <ExcluirMovimentacaoButton slug={slug} movId={id} />
      </div>
      <MovimentacaoForm
        slug={slug}
        ctx={{
          categorias: categorias.map(c => ({
            id: c.id, nome: c.nome, tipo: c.tipo as "ENTRADA" | "SAIDA", cor: c.cor,
            itens: c.itens.map(i => ({ id: i.id, nome: i.nome })),
          })),
          contas: contas.map(c => ({ id: c.id, nome: c.nome, banco: c.banco })),
          clientes: clientes.map(c => ({ id: c.id, nome: c.nome })),
          fornecedores,
          veiculos: veiculos.map(v => ({
            id: v.id,
            label: `${v.marca} ${v.modelo} ${v.anoModelo}${v.placa ? ` — ${v.placa}` : ""}`,
          })),
        }}
        mov={{
          id: mov.id,
          tipo: mov.tipo as "ENTRADA" | "SAIDA",
          status: mov.status as "PENDENTE" | "PAGO" | "CANCELADO",
          descricao: mov.descricao,
          valorCentavos: mov.valorCentavos,
          dataCompetencia: mov.dataCompetencia.toISOString(),
          dataVencimento:  mov.dataVencimento?.toISOString() ?? null,
          dataPagamento:   mov.dataPagamento?.toISOString() ?? null,
          formaPagamento:  mov.formaPagamento ?? null,
          categoriaId:     mov.categoriaId,
          itemId:          mov.itemId,
          contaBancariaId: mov.contaBancariaId,
          clienteId:       mov.clienteId,
          fornecedorId:    mov.fornecedorId,
          veiculoId:       mov.veiculoId,
          observacoes:     mov.observacoes,
          anexos: mov.anexos.map(a => ({ id: a.id, nome: a.nome, url: a.url, mimeType: a.mimeType })),
        }}
      />
    </div>
  );
}
