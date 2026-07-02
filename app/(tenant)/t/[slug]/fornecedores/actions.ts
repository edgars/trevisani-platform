"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove tudo que não for dígito */
function apenasDigitos(v: string) {
  return v.replace(/\D/g, "");
}

async function resolverTenantId(slug: string, session: Awaited<ReturnType<typeof requireSession>>) {
  if (session.user.escopo === "PLATAFORMA") {
    return (await requireTenantPorSlug(slug)).id;
  }
  return session.user.tenantId!;
}

// ─── Schema de validação ──────────────────────────────────────────────────────

const fornecedorSchema = z
  .object({
    tipoPessoa:  z.enum(["PF", "PJ"]),
    nome:        z.string().min(2, "Nome obrigatório"),
    razaoSocial: z.string().optional(),
    documento:   z.string().min(11, "CPF ou CNPJ inválido"),
    email:       z.string().email("E-mail inválido").optional().or(z.literal("")),
    telefone:    z.string().optional(),
    cep:         z.string().optional(),
    logradouro:  z.string().optional(),
    numero:      z.string().optional(),
    complemento: z.string().optional(),
    bairro:      z.string().optional(),
    cidade:      z.string().optional(),
    estado:      z.string().max(2).optional(),
    observacoes: z.string().optional(),
  })
  .transform((d) => ({
    ...d,
    documento:   apenasDigitos(d.documento),
    cep:         d.cep ? apenasDigitos(d.cep) : undefined,
    telefone:    d.telefone ? apenasDigitos(d.telefone) : undefined,
    email:       d.email || undefined,
    razaoSocial: d.tipoPessoa === "PJ" ? d.razaoSocial : undefined,
  }));

// ─── Criar ────────────────────────────────────────────────────────────────────

export async function criarFornecedorAction(
  slug: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const raw = Object.fromEntries(formData.entries());
  const parsed = fornecedorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Verifica duplicidade de documento dentro do tenant
  const existe = await prisma.fornecedor.findFirst({
    where: { tenantId, documento: d.documento },
    select: { id: true },
  });
  if (existe) return { error: "Já existe um fornecedor com esse CPF/CNPJ." };

  await prisma.fornecedor.create({
    data: {
      tenantId,
      tipoPessoa:  d.tipoPessoa as any,
      nome:        d.nome,
      razaoSocial: d.razaoSocial,
      documento:   d.documento,
      email:       d.email,
      telefone:    d.telefone,
      cep:         d.cep,
      logradouro:  d.logradouro,
      numero:      d.numero,
      complemento: d.complemento,
      bairro:      d.bairro,
      cidade:      d.cidade,
      estado:      d.estado,
      observacoes: d.observacoes,
    },
  });

  revalidatePath(`/t/${slug}/fornecedores`);
  redirect(`/t/${slug}/fornecedores`);
}

// ─── Atualizar ────────────────────────────────────────────────────────────────

export async function atualizarFornecedorAction(
  slug: string,
  fornecedorId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const raw = Object.fromEntries(formData.entries());
  const parsed = fornecedorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Verifica duplicidade de documento excluindo o próprio registro
  const existe = await prisma.fornecedor.findFirst({
    where: { tenantId, documento: d.documento, NOT: { id: fornecedorId } },
    select: { id: true },
  });
  if (existe) return { error: "Já existe outro fornecedor com esse CPF/CNPJ." };

  await prisma.fornecedor.update({
    where: { id: fornecedorId },
    data: {
      tipoPessoa:  d.tipoPessoa as any,
      nome:        d.nome,
      razaoSocial: d.razaoSocial,
      documento:   d.documento,
      email:       d.email,
      telefone:    d.telefone,
      cep:         d.cep,
      logradouro:  d.logradouro,
      numero:      d.numero,
      complemento: d.complemento,
      bairro:      d.bairro,
      cidade:      d.cidade,
      estado:      d.estado,
      observacoes: d.observacoes,
    },
  });

  revalidatePath(`/t/${slug}/fornecedores`);
  redirect(`/t/${slug}/fornecedores`);
}

// ─── Toggle ativo ─────────────────────────────────────────────────────────────

export async function toggleAtivoFornecedorAction(
  slug: string,
  fornecedorId: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const f = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, tenantId },
    select: { id: true },
  });
  if (!f) return { error: "Fornecedor não encontrado." };

  await prisma.fornecedor.update({ where: { id: fornecedorId }, data: { ativo } });

  revalidatePath(`/t/${slug}/fornecedores`);
  return {};
}

// ─── Excluir ──────────────────────────────────────────────────────────────────

export async function excluirFornecedorAction(
  slug: string,
  fornecedorId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const f = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, tenantId },
    select: { id: true, _count: { select: { compras: true } } },
  });
  if (!f) return { error: "Fornecedor não encontrado." };
  if (f._count.compras > 0) {
    return { error: "Fornecedor possui compras vinculadas. Inative-o em vez de excluir." };
  }

  await prisma.fornecedor.delete({ where: { id: fornecedorId } });

  revalidatePath(`/t/${slug}/fornecedores`);
  return {};
}
