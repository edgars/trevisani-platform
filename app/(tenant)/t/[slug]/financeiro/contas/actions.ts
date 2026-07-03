"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

const contaSchema = z.object({
  nome:        z.string().min(1, "Nome obrigatório"),
  banco:       z.string().min(1, "Banco obrigatório"),
  codigoBanco: z.string().optional(),
  agencia:     z.string().optional(),
  conta:       z.string().optional(),
  tipoConta:   z.string().default("corrente"),
  pix:         z.string().optional(),
});

async function getTenantId(): Promise<string> {
  const s = await requireSession();
  return s.user.tenantId!;
}

export async function criarContaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.contaBancaria.create({ data: { tenantId, ...parsed.data } });
  revalidateTag("contas");
  revalidatePath("/", "layout");
  return {};
}

export async function atualizarContaAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const parsed = contaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const conta = await prisma.contaBancaria.findFirst({ where: { id, tenantId } });
  if (!conta) return { error: "Conta não encontrada." };
  await prisma.contaBancaria.update({ where: { id }, data: parsed.data });
  revalidateTag("contas");
  revalidatePath("/", "layout");
  return {};
}

export async function excluirContaAction(id: string): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const conta = await prisma.contaBancaria.findFirst({ where: { id, tenantId } });
  if (!conta) return { error: "Conta não encontrada." };
  const vinculadas = await prisma.movimentacao.count({ where: { contaBancariaId: id } });
  if (vinculadas > 0)
    return { error: `Esta conta possui ${vinculadas} movimentação(ões) vinculada(s). Desative-a em vez de excluir.` };
  await prisma.contaBancaria.delete({ where: { id } });
  revalidateTag("contas");
  revalidatePath("/", "layout");
  return {};
}

export async function toggleAtivoContaAction(id: string, ativo: boolean): Promise<void> {
  const tenantId = await getTenantId();
  await prisma.contaBancaria.updateMany({ where: { id, tenantId }, data: { ativo } });
  revalidateTag("contas");
  revalidatePath("/", "layout");
}
