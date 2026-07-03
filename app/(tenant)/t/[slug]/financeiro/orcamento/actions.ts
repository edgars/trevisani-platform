"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

export interface LinhaOrcamento {
  id:           string;  // client-generated uuid
  descricao:    string;
  categoriaId?: string | null;
  valorCentavos: number;
}

export interface OrcamentoPayload {
  ano:     number;
  mes:     number;
  receitas: LinhaOrcamento[];
  despesas: LinhaOrcamento[];
  aliquotaOverridesPct?:       number | null;
  overheadOverrideCentavos?:   number | null;
  observacoes?: string;
}

async function getTenantId() {
  const s = await requireSession();
  return s.user.tenantId!;
}

export async function salvarOrcamentoAction(
  payload: OrcamentoPayload,
): Promise<{ error?: string }> {
  try {
    const tenantId = await getTenantId();
    const { ano, mes, receitas, despesas, aliquotaOverridesPct, overheadOverrideCentavos, observacoes } = payload;

    await prisma.orcamentoMensal.upsert({
      where:  { tenantId_ano_mes: { tenantId, ano, mes } },
      create: {
        tenantId, ano, mes,
        receitasJson: receitas as object[],
        despesasJson: despesas as object[],
        aliquotaOverridesPct: aliquotaOverridesPct ?? null,
        overheadOverrideCentavos: overheadOverrideCentavos ?? null,
        observacoes: observacoes ?? null,
      },
      update: {
        receitasJson: receitas as object[],
        despesasJson: despesas as object[],
        aliquotaOverridesPct: aliquotaOverridesPct ?? null,
        overheadOverrideCentavos: overheadOverrideCentavos ?? null,
        observacoes: observacoes ?? null,
      },
    });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
    revalidatePath(`/t/${tenant?.slug}/financeiro/orcamento`);
    revalidatePath(`/t/${tenant?.slug}/financeiro/dre`);
    return {};
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function carregarOrcamentoAction(
  ano: number,
  mes: number,
): Promise<OrcamentoPayload | null> {
  const tenantId = await getTenantId();
  const orc = await prisma.orcamentoMensal.findUnique({
    where: { tenantId_ano_mes: { tenantId, ano, mes } },
  });
  if (!orc) return null;
  return {
    ano: orc.ano,
    mes: orc.mes,
    receitas: orc.receitasJson as unknown as LinhaOrcamento[],
    despesas: orc.despesasJson as unknown as LinhaOrcamento[],
    aliquotaOverridesPct: orc.aliquotaOverridesPct ? Number(orc.aliquotaOverridesPct) : null,
    overheadOverrideCentavos: orc.overheadOverrideCentavos,
    observacoes: orc.observacoes ?? undefined,
  };
}
