import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { OrcamentoEditor } from "./orcamento-editor";
import type { LinhaOrcamento } from "./actions";

export const metadata = { title: "DRE Planejado" };

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;
  const sp = await searchParams;

  const now = new Date();
  const ano = parseInt(sp.ano ?? String(now.getFullYear()), 10);
  const mes = parseInt(sp.mes ?? String(now.getMonth() + 1), 10);

  const [categorias, orcamento, configFiscal] = await Promise.all([
    prisma.categoriaFinanceira.findMany({
      where: { tenantId, ativo: true },
      select: { id: true, nome: true, tipo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.orcamentoMensal.findUnique({
      where: { tenantId_ano_mes: { tenantId, ano, mes } },
    }),
    prisma.configuracaoFiscal.findUnique({ where: { tenantId } }),
  ]);

  const receitas: LinhaOrcamento[] = orcamento
    ? (orcamento.receitasJson as unknown as LinhaOrcamento[])
    : [];
  const despesas: LinhaOrcamento[] = orcamento
    ? (orcamento.despesasJson as unknown as LinhaOrcamento[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">DRE Planejado</h2>
        <p className="text-sm text-muted-foreground">
          Monte o orçamento mensal com receitas esperadas, despesas fixas, impostos e overhead.
        </p>
      </div>
      <OrcamentoEditor
        ano={ano}
        mes={mes}
        receitas={receitas}
        despesas={despesas}
        categorias={categorias}
        aliquotaBase={configFiscal ? Number(configFiscal.aliquotaImpostosPct) : 6}
        overheadBase={configFiscal?.overheadMensalCentavos ?? 0}
        aliquotaOverride={orcamento?.aliquotaOverridesPct ? Number(orcamento.aliquotaOverridesPct) : null}
        overheadOverride={orcamento?.overheadOverrideCentavos ?? null}
        observacoes={orcamento?.observacoes ?? ""}
      />
    </div>
  );
}
