"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

async function assertAdmin() {
  await requireScope("PLATAFORMA");
}

const movSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  descricao: z.string().min(1, "Descrição obrigatória"),
  valorStr: z.string().min(1, "Valor obrigatório"),
  dataCompetencia: z.string().min(1, "Data obrigatória"),
  dataVencimento: z.string().optional(),
  dataPagamento: z.string().optional(),
  formaPagamento: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO"]).default("PENDENTE"),
  categoria: z.string().optional(),
  contaBancariaId: z.string().optional(),
  emissorId: z.string().optional(),
  observacoes: z.string().optional(),
});

function parseValor(s: string): number {
  return Math.round(parseFloat(s.replace(/\./g, "").replace(",", ".")) * 100);
}

function buildData(parsed: z.infer<typeof movSchema>) {
  return {
    tipo: parsed.tipo,
    status: parsed.status,
    descricao: parsed.descricao,
    valorCentavos: parseValor(parsed.valorStr),
    dataCompetencia: new Date(parsed.dataCompetencia),
    dataVencimento: parsed.dataVencimento ? new Date(parsed.dataVencimento) : null,
    dataPagamento: parsed.dataPagamento ? new Date(parsed.dataPagamento) : null,
    formaPagamento: (parsed.formaPagamento as "PIX" | "BOLETO" | "CARTAO" | "TRANSFERENCIA" | "FINANCIAMENTO" | "DINHEIRO" | "OUTRO" | undefined) || null,
    categoria: parsed.categoria || null,
    contaBancariaId: parsed.contaBancariaId || null,
    emissorId: parsed.emissorId || null,
    observacoes: parsed.observacoes || null,
  };
}

function readForm(formData: FormData) {
  return {
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    valorStr: String(formData.get("valorStr") ?? ""),
    dataCompetencia: formData.get("dataCompetencia"),
    dataVencimento: formData.get("dataVencimento") || undefined,
    dataPagamento: formData.get("dataPagamento") || undefined,
    formaPagamento: formData.get("formaPagamento") || undefined,
    status: formData.get("status") || "PENDENTE",
    categoria: formData.get("categoria") || undefined,
    contaBancariaId: formData.get("contaBancariaId") || undefined,
    emissorId: formData.get("emissorId") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  };
}

export async function criarMovimentacaoAction(
  _prev: { error?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  await assertAdmin();
  const parsed = movSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const { id } = await prisma.movimentacaoPlataforma.create({ data: buildData(parsed.data), select: { id: true } });
  revalidatePath("/admin/financeiro");
  return { id };
}

export async function atualizarMovimentacaoAction(
  movId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const mov = await prisma.movimentacaoPlataforma.findUnique({ where: { id: movId } });
  if (!mov) return { error: "Movimentação não encontrada." };
  const parsed = movSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.movimentacaoPlataforma.update({ where: { id: movId }, data: buildData(parsed.data) });
  revalidatePath("/admin/financeiro");
  return {};
}

export async function excluirMovimentacaoAction(movId: string): Promise<{ error?: string }> {
  await assertAdmin();
  const mov = await prisma.movimentacaoPlataforma.findUnique({ where: { id: movId } });
  if (!mov) return { error: "Movimentação não encontrada." };
  await prisma.movimentacaoPlataforma.delete({ where: { id: movId } });
  revalidatePath("/admin/financeiro");
  return {};
}
