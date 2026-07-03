import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";
import { MovimentacaoForm } from "../../nova/movimentacao-form";
import { ExcluirMovimentacaoButton } from "./excluir-button";

export const metadata = { title: "Editar Movimentação" };
export const dynamic = "force-dynamic";

export default async function EditarMovimentacaoPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const [{ id }] = await Promise.all([params, requireScope("PLATAFORMA")]);

  const [mov, contas, emissores] = await Promise.all([
    prisma.movimentacaoPlataforma.findUnique({
      where: { id },
      include: { recorrencia: { select: { id: true, descricao: true } } },
    }),
    prisma.contaBancariaPlataforma.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, banco: true },
    }),
    prisma.emissorFinanceiroPlataforma.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true },
    }),
  ]);

  if (!mov) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Link href="/admin/financeiro/movimentacoes"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight truncate max-w-[400px]">{mov.descricao}</h1>
            <p className="text-sm text-muted-foreground">Editar movimentação</p>
          </div>
        </div>
        <ExcluirMovimentacaoButton movId={id} />
      </div>
      <MovimentacaoForm
        ctx={{ contas, emissores }}
        mov={{
          id: mov.id,
          tipo: mov.tipo,
          status: mov.status,
          descricao: mov.descricao,
          categoria: mov.categoria,
          valorCentavos: mov.valorCentavos,
          dataCompetencia: mov.dataCompetencia.toISOString(),
          dataVencimento: mov.dataVencimento?.toISOString() ?? null,
          dataPagamento: mov.dataPagamento?.toISOString() ?? null,
          formaPagamento: mov.formaPagamento ?? null,
          contaBancariaId: mov.contaBancariaId,
          emissorId: mov.emissorId,
          observacoes: mov.observacoes,
          recorrencia: mov.recorrencia,
        }}
      />
    </div>
  );
}
