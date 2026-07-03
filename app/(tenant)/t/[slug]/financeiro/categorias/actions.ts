"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { CATEGORIAS_PADRAO } from "@/lib/data/bancos";

async function getTenantId(): Promise<string> {
  const s = await requireSession();
  return s.user.tenantId!;
}

const catSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  cor:  z.string().optional(),
  icone: z.string().optional(),
});

const itemSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
});

export async function criarCategoriaAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const parsed = catSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  try {
    await prisma.categoriaFinanceira.create({ data: { tenantId, ...parsed.data } });
    revalidateTag("categorias");
    revalidatePath("/", "layout");
    return {};
  } catch {
    return { error: "Já existe uma categoria com este nome." };
  }
}

export async function atualizarCategoriaAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const parsed = catSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  const cat = await prisma.categoriaFinanceira.findFirst({ where: { id, tenantId } });
  if (!cat) return { error: "Categoria não encontrada." };
  await prisma.categoriaFinanceira.update({ where: { id }, data: parsed.data });
  revalidateTag("categorias");
  revalidatePath("/", "layout");
  return {};
}

export async function excluirCategoriaAction(id: string): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const cat = await prisma.categoriaFinanceira.findFirst({ where: { id, tenantId } });
  if (!cat) return { error: "Categoria não encontrada." };
  const vinculadas = await prisma.movimentacao.count({ where: { categoriaId: id } });
  if (vinculadas > 0)
    return { error: `Esta categoria tem ${vinculadas} movimentação(ões). Não pode ser excluída.` };
  await prisma.categoriaFinanceira.delete({ where: { id } });
  revalidateTag("categorias");
  revalidatePath("/", "layout");
  return {};
}

export async function criarItemCategoriaAction(
  categoriaId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await getTenantId();
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  try {
    await prisma.itemCategoriaFinanceira.create({ data: { categoriaId, ...parsed.data } });
    revalidatePath("/", "layout");
    return {};
  } catch {
    return { error: "Já existe um item com este nome nesta categoria." };
  }
}

export async function excluirItemCategoriaAction(itemId: string): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const item = await prisma.itemCategoriaFinanceira.findFirst({
    where: { id: itemId },
    include: { categoria: { select: { tenantId: true } } },
  });
  if (!item || item.categoria.tenantId !== tenantId) return { error: "Item não encontrado." };
  const vinculados = await prisma.movimentacao.count({ where: { itemId } });
  if (vinculados > 0)
    return { error: `Este item tem ${vinculados} movimentação(ões) vinculada(s).` };
  await prisma.itemCategoriaFinanceira.delete({ where: { id: itemId } });
  revalidateTag("categorias");
  revalidatePath("/", "layout");
  return {};
}

/** Seed das categorias padrão para o tenant */
export async function seedCategoriasPadraoAction(): Promise<void> {
  const tenantId = await getTenantId();
  await Promise.all(
    CATEGORIAS_PADRAO.map((cat) =>
      prisma.categoriaFinanceira
        .upsert({
          where: { tenantId_nome: { tenantId, nome: cat.nome } },
          create: { tenantId, nome: cat.nome, tipo: cat.tipo, cor: cat.cor, icone: cat.icone },
          update: {},
        })
        .catch(() => null),
    ),
  );
  revalidateTag("categorias");
  revalidatePath("/", "layout");
}
