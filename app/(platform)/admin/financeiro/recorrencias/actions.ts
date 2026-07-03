"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";
import { gerarMovimentacoesRecorrentesPendentes } from "@/lib/financeiro-plataforma/recorrencias";

async function assertAdmin() {
  await requireScope("PLATAFORMA");
}

const recorrenciaSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  descricao: z.string().min(1, "Descrição obrigatória"),
  categoria: z.string().optional(),
  valorStr: z.string().min(1, "Valor obrigatório"),
  diaVencimento: z.coerce.number().int().min(1).max(28).default(5),
  formaPagamento: z.string().optional(),
  contaBancariaId: z.string().optional(),
  emissorId: z.string().optional(),
  dataInicio: z.string().min(1, "Data de início obrigatória"),
  observacoes: z.string().optional(),
});

function parseValor(s: string): number {
  return Math.round(parseFloat(s.replace(/\./g, "").replace(",", ".")) * 100);
}

function readForm(formData: FormData) {
  return {
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    categoria: formData.get("categoria") || undefined,
    valorStr: String(formData.get("valorStr") ?? ""),
    diaVencimento: formData.get("diaVencimento") || 5,
    formaPagamento: formData.get("formaPagamento") || undefined,
    contaBancariaId: formData.get("contaBancariaId") || undefined,
    emissorId: formData.get("emissorId") || undefined,
    dataInicio: formData.get("dataInicio"),
    observacoes: formData.get("observacoes") || undefined,
  };
}

function buildData(parsed: z.infer<typeof recorrenciaSchema>) {
  return {
    tipo: parsed.tipo,
    descricao: parsed.descricao,
    categoria: parsed.categoria || null,
    valorPadraoCentavos: parseValor(parsed.valorStr),
    diaVencimento: parsed.diaVencimento,
    formaPagamento: (parsed.formaPagamento as "PIX" | "BOLETO" | "CARTAO" | "TRANSFERENCIA" | "FINANCIAMENTO" | "DINHEIRO" | "OUTRO" | undefined) || null,
    contaBancariaId: parsed.contaBancariaId || null,
    emissorId: parsed.emissorId || null,
    dataInicio: new Date(parsed.dataInicio),
    observacoes: parsed.observacoes || null,
  };
}

export async function criarRecorrenciaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = recorrenciaSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.movimentacaoRecorrentePlataforma.create({ data: buildData(parsed.data) });
  await gerarMovimentacoesRecorrentesPendentes();
  revalidatePath("/admin/financeiro/recorrencias");
  revalidatePath("/admin/financeiro/movimentacoes");
  revalidatePath("/admin/financeiro");
  return {};
}

export async function atualizarRecorrenciaAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = recorrenciaSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const recorrencia = await prisma.movimentacaoRecorrentePlataforma.findUnique({ where: { id } });
  if (!recorrencia) return { error: "Recorrência não encontrada." };
  await prisma.movimentacaoRecorrentePlataforma.update({ where: { id }, data: buildData(parsed.data) });
  revalidatePath("/admin/financeiro/recorrencias");
  return {};
}

export async function cancelarRecorrenciaAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  await prisma.movimentacaoRecorrentePlataforma.update({
    where: { id },
    data: { ativa: false, dataFim: new Date() },
  });
  revalidatePath("/admin/financeiro/recorrencias");
  return {};
}

export async function reativarRecorrenciaAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  await prisma.movimentacaoRecorrentePlataforma.update({
    where: { id },
    data: { ativa: true, dataFim: null },
  });
  await gerarMovimentacoesRecorrentesPendentes();
  revalidatePath("/admin/financeiro/recorrencias");
  revalidatePath("/admin/financeiro/movimentacoes");
  return {};
}

export async function excluirRecorrenciaAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  const geradas = await prisma.movimentacaoPlataforma.count({ where: { recorrenteId: id } });
  if (geradas > 0)
    return { error: `Esta recorrência já gerou ${geradas} movimentação(ões). Cancele-a em vez de excluir, para preservar o histórico.` };
  await prisma.movimentacaoRecorrentePlataforma.delete({ where: { id } });
  revalidatePath("/admin/financeiro/recorrencias");
  return {};
}
