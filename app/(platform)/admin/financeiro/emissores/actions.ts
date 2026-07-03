"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

async function assertAdmin() {
  await requireScope("PLATAFORMA");
}

const emissorSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["EMPRESA", "FUNCIONARIO", "SOCIO"]),
  documento: z.string().optional(),
  contato: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function criarEmissorAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = emissorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.emissorFinanceiroPlataforma.create({ data: parsed.data });
  revalidatePath("/admin/financeiro/emissores");
  return {};
}

export async function atualizarEmissorAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = emissorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const emissor = await prisma.emissorFinanceiroPlataforma.findUnique({ where: { id } });
  if (!emissor) return { error: "Emissor não encontrado." };
  await prisma.emissorFinanceiroPlataforma.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/financeiro/emissores");
  return {};
}

export async function excluirEmissorAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  const emissor = await prisma.emissorFinanceiroPlataforma.findUnique({ where: { id } });
  if (!emissor) return { error: "Emissor não encontrado." };
  const [vinculadas, recorrencias] = await Promise.all([
    prisma.movimentacaoPlataforma.count({ where: { emissorId: id } }),
    prisma.movimentacaoRecorrentePlataforma.count({ where: { emissorId: id } }),
  ]);
  if (vinculadas > 0 || recorrencias > 0)
    return { error: `Este emissor possui ${vinculadas} movimentação(ões) e ${recorrencias} recorrência(s) vinculada(s). Desative-o em vez de excluir.` };
  await prisma.emissorFinanceiroPlataforma.delete({ where: { id } });
  revalidatePath("/admin/financeiro/emissores");
  return {};
}

export async function toggleAtivoEmissorAction(id: string, ativo: boolean): Promise<void> {
  await assertAdmin();
  await prisma.emissorFinanceiroPlataforma.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/financeiro/emissores");
}
