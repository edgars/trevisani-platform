import { prisma } from "@/lib/db/client";

/** Último dia do mês (28-31), usado para não estourar meses curtos (fevereiro). */
function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Garante que toda recorrência ativa tenha uma MovimentacaoPlataforma gerada
 * para cada mês entre o início da recorrência e o mês atual (inclusive),
 * preenchendo meses "perdidos" caso o admin não acesse o painel todo mês.
 *
 * Idempotente: pode ser chamada em toda visita às páginas de Financeiro
 * sem duplicar lançamentos (verifica existência por recorrenteId + mês).
 */
export async function gerarMovimentacoesRecorrentesPendentes(): Promise<void> {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  const recorrencias = await prisma.movimentacaoRecorrentePlataforma.findMany({
    where: { ativa: true },
  });

  for (const r of recorrencias) {
    let ano = r.dataInicio.getFullYear();
    let mes = r.dataInicio.getMonth() + 1;

    while (ano < anoAtual || (ano === anoAtual && mes <= mesAtual)) {
      const periodoInicio = new Date(ano, mes - 1, 1);
      const periodoFim = new Date(ano, mes, 0, 23, 59, 59, 999);

      const jaExiste = await prisma.movimentacaoPlataforma.findFirst({
        where: { recorrenteId: r.id, dataCompetencia: { gte: periodoInicio, lte: periodoFim } },
        select: { id: true },
      });

      if (!jaExiste) {
        const dia = Math.min(r.diaVencimento, ultimoDiaDoMes(ano, mes));
        const dataCompetencia = new Date(ano, mes - 1, dia);
        await prisma.movimentacaoPlataforma.create({
          data: {
            tipo: r.tipo,
            status: "PENDENTE",
            descricao: r.descricao,
            categoria: r.categoria,
            valorCentavos: r.valorPadraoCentavos,
            dataCompetencia,
            dataVencimento: dataCompetencia,
            formaPagamento: r.formaPagamento,
            contaBancariaId: r.contaBancariaId,
            emissorId: r.emissorId,
            recorrenteId: r.id,
            observacoes: r.observacoes,
          },
        });
      }

      mes++;
      if (mes > 12) { mes = 1; ano++; }
    }
  }
}
