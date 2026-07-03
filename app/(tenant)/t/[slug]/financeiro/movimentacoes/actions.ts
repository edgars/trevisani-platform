"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { GERAIS_BUCKET, getPublicUrl, uploadArquivo } from "@/lib/storage/supabase";
import { atualizarStorageTenant } from "@/lib/tracking/eventos";

async function getTenantId(): Promise<string> {
  const s = await requireSession();
  return s.user.tenantId!;
}

const movSchema = z.object({
  tipo:            z.enum(["ENTRADA", "SAIDA"]),
  descricao:       z.string().min(1, "Descrição obrigatória"),
  valorStr:        z.string().min(1, "Valor obrigatório"),
  dataCompetencia: z.string().min(1, "Data obrigatória"),
  dataVencimento:  z.string().optional(),
  dataPagamento:   z.string().optional(),
  formaPagamento:  z.string().optional(),
  status:          z.enum(["PENDENTE", "PAGO", "CANCELADO"]).default("PENDENTE"),
  categoriaId:     z.string().optional(),
  itemId:          z.string().optional(),
  contaBancariaId: z.string().optional(),
  clienteId:       z.string().optional(),
  fornecedorId:    z.string().optional(),
  veiculoId:       z.string().optional(),
  compraId:        z.string().optional(),
  vendaId:         z.string().optional(),
  observacoes:     z.string().optional(),
});

function parseValor(s: string): number {
  // Aceita "1.234,56" ou "1234.56" ou "1234"
  return Math.round(parseFloat(s.replace(/\./g, "").replace(",", ".")) * 100);
}

function buildData(parsed: z.infer<typeof movSchema>, tenantId: string) {
  return {
    tenantId,
    tipo:            parsed.tipo as "ENTRADA" | "SAIDA",
    status:          parsed.status as "PENDENTE" | "PAGO" | "CANCELADO",
    descricao:       parsed.descricao,
    valorCentavos:   parseValor(parsed.valorStr),
    dataCompetencia: new Date(parsed.dataCompetencia),
    dataVencimento:  parsed.dataVencimento ? new Date(parsed.dataVencimento) : null,
    dataPagamento:   parsed.dataPagamento  ? new Date(parsed.dataPagamento)  : null,
    formaPagamento:  (parsed.formaPagamento as "PIX" | "BOLETO" | "CARTAO" | "TRANSFERENCIA" | "FINANCIAMENTO" | "DINHEIRO" | "OUTRO" | undefined) || null,
    categoriaId:     parsed.categoriaId    || null,
    itemId:          parsed.itemId         || null,
    contaBancariaId: parsed.contaBancariaId || null,
    clienteId:       parsed.clienteId      || null,
    fornecedorId:    parsed.fornecedorId   || null,
    veiculoId:       parsed.veiculoId      || null,
    compraId:        parsed.compraId       || null,
    vendaId:         parsed.vendaId        || null,
    observacoes:     parsed.observacoes    || null,
  };
}

export async function criarMovimentacaoAction(
  tenantSlug: string,
  _prev: { error?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const tenantId = await getTenantId();
  const raw = {
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    valorStr: String(formData.get("valorStr") ?? ""),
    dataCompetencia: formData.get("dataCompetencia"),
    dataVencimento: formData.get("dataVencimento") || undefined,
    dataPagamento: formData.get("dataPagamento") || undefined,
    formaPagamento: formData.get("formaPagamento") || undefined,
    status: formData.get("status") || "PENDENTE",
    categoriaId: formData.get("categoriaId") || undefined,
    itemId: formData.get("itemId") || undefined,
    contaBancariaId: formData.get("contaBancariaId") || undefined,
    clienteId: formData.get("clienteId") || undefined,
    fornecedorId: formData.get("fornecedorId") || undefined,
    veiculoId: formData.get("veiculoId") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  };
  const parsed = movSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const { id } = await prisma.movimentacao.create({ data: buildData(parsed.data, tenantId), select: { id: true } });
  revalidatePath(`/t/${tenantSlug}/financeiro`);
  // Return the new ID so the client component can redirect without calling redirect() here
  return { id };
}

export async function atualizarMovimentacaoAction(
  tenantSlug: string,
  movId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const mov = await prisma.movimentacao.findFirst({ where: { id: movId, tenantId } });
  if (!mov) return { error: "Movimentação não encontrada." };

  const raw = {
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    valorStr: String(formData.get("valorStr") ?? ""),
    dataCompetencia: formData.get("dataCompetencia"),
    dataVencimento: formData.get("dataVencimento") || undefined,
    dataPagamento: formData.get("dataPagamento") || undefined,
    formaPagamento: formData.get("formaPagamento") || undefined,
    status: formData.get("status") || "PENDENTE",
    categoriaId: formData.get("categoriaId") || undefined,
    itemId: formData.get("itemId") || undefined,
    contaBancariaId: formData.get("contaBancariaId") || undefined,
    clienteId: formData.get("clienteId") || undefined,
    fornecedorId: formData.get("fornecedorId") || undefined,
    veiculoId: formData.get("veiculoId") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  };
  const parsed = movSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.movimentacao.update({ where: { id: movId }, data: buildData(parsed.data, tenantId) });
  revalidatePath(`/t/${tenantSlug}/financeiro`);
  return {};
}

export async function excluirMovimentacaoAction(tenantSlug: string, movId: string): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const mov = await prisma.movimentacao.findFirst({ where: { id: movId, tenantId } });
  if (!mov) return { error: "Movimentação não encontrada." };
  await prisma.movimentacao.delete({ where: { id: movId } });
  revalidatePath(`/t/${tenantSlug}/financeiro`);
  return {};
}

export async function uploadAnexoMovimentacaoAction(
  tenantSlug: string,
  movId: string,
  formData: FormData,
): Promise<{ error?: string; anexo?: { id: string; nome: string; url: string } }> {
  const tenantId = await getTenantId();
  const mov = await prisma.movimentacao.findFirst({ where: { id: movId, tenantId } });
  if (!mov) return { error: "Movimentação não encontrada." };

  const file = formData.get("arquivo") as File | null;
  if (!file) return { error: "Arquivo não enviado." };
  if (file.size > 10 * 1024 * 1024) return { error: "Arquivo muito grande (máx 10 MB)." };

  const extMap: Record<string, string> = {
    "application/pdf": "pdf", "image/jpeg": "jpg",
    "image/png": "png", "image/webp": "webp",
  };
  const ext = extMap[file.type] ?? "bin";
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `financeiro/${movId}/anexos/${Date.now()}.${ext}`;
  await uploadArquivo(GERAIS_BUCKET, storagePath, buffer, file.type);
  atualizarStorageTenant(tenantId, buffer.length);
  const url = getPublicUrl(GERAIS_BUCKET, storagePath);

  const anexo = await prisma.anexoMovimentacao.create({
    data: { movimentacaoId: movId, nome: file.name, url, storagePath, mimeType: file.type, tamanhoBytes: file.size },
    select: { id: true, nome: true, url: true },
  });
  revalidatePath(`/t/${tenantSlug}/financeiro`);
  return { anexo };
}

export async function excluirAnexoAction(tenantSlug: string, anexoId: string): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const anexo = await prisma.anexoMovimentacao.findFirst({
    where: { id: anexoId },
    include: { movimentacao: { select: { tenantId: true } } },
  });
  if (!anexo || anexo.movimentacao.tenantId !== tenantId) return { error: "Anexo não encontrado." };
  await prisma.anexoMovimentacao.delete({ where: { id: anexoId } });
  revalidatePath(`/t/${tenantSlug}/financeiro`);
  return {};
}
