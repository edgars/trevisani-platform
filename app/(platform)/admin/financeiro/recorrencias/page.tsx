import { requireScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { RecorrenciasManager } from "./recorrencias-manager";

export const metadata = { title: "Recorrências Financeiras da Plataforma" };
export const dynamic = "force-dynamic";

export default async function AdminRecorrenciasPage() {
  await requireScope("PLATAFORMA");

  const [recorrencias, contas, emissores] = await Promise.all([
    prisma.movimentacaoRecorrentePlataforma.findMany({
      orderBy: [{ ativa: "desc" }, { descricao: "asc" }],
      include: { _count: { select: { movimentacoes: true } } },
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Recorrências</h2>
        <p className="text-sm text-muted-foreground">
          Despesas ou receitas mensais que se repetem automaticamente todo mês. Cada mês gerado pode ter seu valor
          editado individualmente — cancele a recorrência a qualquer momento para interromper novos meses.
        </p>
      </div>
      <RecorrenciasManager
        ctx={{ contas, emissores }}
        recorrencias={recorrencias.map(r => ({
          id: r.id,
          tipo: r.tipo,
          descricao: r.descricao,
          categoria: r.categoria,
          valorPadraoCentavos: r.valorPadraoCentavos,
          diaVencimento: r.diaVencimento,
          formaPagamento: r.formaPagamento,
          contaBancariaId: r.contaBancariaId,
          emissorId: r.emissorId,
          observacoes: r.observacoes,
          ativa: r.ativa,
          dataInicio: r.dataInicio.toISOString(),
          dataFim: r.dataFim?.toISOString() ?? null,
          totalGeradas: r._count.movimentacoes,
        }))}
      />
    </div>
  );
}
