"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

const contaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  banco: z.string().min(1, "Banco obrigatório"),
  codigoBanco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipoConta: z.string().default("corrente"),
  pix: z.string().optional(),
});

async function assertAdmin() {
  await requireScope("PLATAFORMA");
}

export async function criarContaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.contaBancariaPlataforma.create({ data: parsed.data });
  revalidatePath("/admin/financeiro/contas");
  return {};
}

export async function atualizarContaAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const conta = await prisma.contaBancariaPlataforma.findUnique({ where: { id } });
  if (!conta) return { error: "Conta não encontrada." };
  await prisma.contaBancariaPlataforma.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/financeiro/contas");
  return {};
}

export async function excluirContaAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  const conta = await prisma.contaBancariaPlataforma.findUnique({ where: { id } });
  if (!conta) return { error: "Conta não encontrada." };
  const vinculadas = await prisma.movimentacaoPlataforma.count({ where: { contaBancariaId: id } });
  if (vinculadas > 0)
    return { error: `Esta conta possui ${vinculadas} movimentação(ões) vinculada(s). Desative-a em vez de excluir.` };
  await prisma.contaBancariaPlataforma.delete({ where: { id } });
  revalidatePath("/admin/financeiro/contas");
  return {};
}

export async function toggleAtivoContaAction(id: string, ativo: boolean): Promise<void> {
  await assertAdmin();
  await prisma.contaBancariaPlataforma.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/financeiro/contas");
}
