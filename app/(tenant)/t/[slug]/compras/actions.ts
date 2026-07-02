"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { parseCentavos } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolverTenantId(slug: string) {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    throw new Error("Sem permissão.");
  }
  return session.user.escopo === "PLATAFORMA"
    ? (await requireTenantPorSlug(slug)).id
    : session.user.tenantId!;
}

async function proximoNumero(tenantId: string): Promise<number> {
  const last = await prisma.compra.findFirst({
    where: { tenantId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  veiculoId:    z.string().min(1, "Veículo obrigatório"),
  valorCentavos: z.coerce.number().int().min(0),
  observacoes:  z.string().optional(),
});

const compraSchema = z.object({
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  dataOperacao: z.string().optional(),
  observacoes:  z.string().optional(),
  itens:        z.array(itemSchema).min(1, "Adicione ao menos um veículo."),
});

const pagamentoSchema = z.object({
  descricao:      z.string().min(1, "Descrição obrigatória"),
  valorStr:       z.string(),
  formaPagamento: z.enum(["PIX","BOLETO","CARTAO","TRANSFERENCIA","FINANCIAMENTO","DINHEIRO","OUTRO"]),
});

// ─── Criar compra ─────────────────────────────────────────────────────────────

export async function criarCompraAction(
  slug: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await resolverTenantId(slug).catch((e) => { throw e; });

  // Itens chegam como JSON string
  let itensRaw: unknown;
  try { itensRaw = JSON.parse(String(formData.get("itensJson") ?? "[]")); }
  catch { return { error: "Dados de itens inválidos." }; }

  const parsed = compraSchema.safeParse({
    fornecedorId: formData.get("fornecedorId"),
    dataOperacao: formData.get("dataOperacao") || undefined,
    observacoes:  formData.get("observacoes")  || undefined,
    itens:        itensRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Garante que o fornecedor pertence ao tenant
  const fornecedor = await prisma.fornecedor.findFirst({
    where: { id: d.fornecedorId, tenantId },
    select: { id: true },
  });
  if (!fornecedor) return { error: "Fornecedor não encontrado." };

  // Garante que todos os veículos pertencem ao tenant e estão disponíveis
  const veiculoIds = d.itens.map((i) => i.veiculoId);
  const veiculos = await prisma.veiculo.findMany({
    where: { id: { in: veiculoIds }, tenantId },
    select: { id: true, status: true, marca: true, modelo: true },
  });
  if (veiculos.length !== veiculoIds.length) {
    return { error: "Um ou mais veículos não encontrados." };
  }
  const emUso = veiculos.find((v) =>
    !["EM_PREPARACAO","DISPONIVEL","NEGOCIANDO"].includes(v.status),
  );
  if (emUso) {
    return { error: `${emUso.marca} ${emUso.modelo} já possui status que impede nova compra.` };
  }

  const valorTotal = d.itens.reduce((s, i) => s + i.valorCentavos, 0);
  const numero = await proximoNumero(tenantId);
  const dataOp = d.dataOperacao ? new Date(d.dataOperacao) : new Date();

  await prisma.$transaction([
    prisma.compra.create({
      data: {
        tenantId,
        fornecedorId: d.fornecedorId,
        numero,
        dataOperacao:       dataOp,
        valorTotalCentavos: valorTotal,
        observacoes:        d.observacoes,
        status:             "RASCUNHO",
        itens: {
          create: d.itens.map((item) => ({
            veiculoId:    item.veiculoId,
            valorCentavos: item.valorCentavos,
            observacoes:  item.observacoes,
          })),
        },
      },
    }),
    // Vincula os veículos ao fornecedor (se ainda não estiver vinculado)
    ...veiculos.map((v) =>
      prisma.veiculo.update({
        where: { id: v.id },
        data: { fornecedorId: d.fornecedorId },
      }),
    ),
  ]);

  revalidatePath(`/t/${slug}/compras`);
  revalidatePath(`/t/${slug}/fornecedores`);
  redirect(`/t/${slug}/compras`);
}

// ─── Atualizar status da compra ───────────────────────────────────────────────

const statusSchema = z.enum(["RASCUNHO","AGUARDANDO_ASSINATURA","CONCLUIDA","CANCELADA"]);

export async function atualizarStatusCompraAction(
  slug: string,
  compraId: string,
  status: z.infer<typeof statusSchema>,
): Promise<{ error?: string }> {
  const tenantId = await resolverTenantId(slug).catch((e) => ({ error: e.message }));
  if (typeof tenantId !== "string") return tenantId as { error: string };

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Status inválido." };

  const compra = await prisma.compra.findFirst({
    where: { id: compraId, tenantId },
    include: { itens: { select: { veiculoId: true } } },
  });
  if (!compra) return { error: "Compra não encontrada." };

  const updates: Promise<any>[] = [
    prisma.compra.update({
      where: { id: compraId },
      data: { status: parsed.data },
    }),
  ];

  // Ao concluir: marca os veículos como EM_PREPARACAO
  // Ao cancelar: volta para EM_PREPARACAO (sem mudar para DISPONIVEL, pois ainda precisam de preparo)
  if (parsed.data === "CONCLUIDA") {
    updates.push(
      prisma.veiculo.updateMany({
        where: { id: { in: compra.itens.map((i) => i.veiculoId) } },
        data: { status: "EM_PREPARACAO" },
      }),
    );
  }

  await Promise.all(updates);

  revalidatePath(`/t/${slug}/compras`);
  revalidatePath(`/t/${slug}/veiculos`);
  return {};
}

// ─── Lançar pagamento na compra ───────────────────────────────────────────────

export async function lancarPagamentoCompraAction(
  slug: string,
  compraId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const tenantId = await resolverTenantId(slug).catch((e) => ({ error: e.message }));
  if (typeof tenantId !== "string") return tenantId as { error: string };

  const parsed = pagamentoSchema.safeParse({
    descricao:      formData.get("descricao"),
    valorStr:       formData.get("valor"),
    formaPagamento: formData.get("formaPagamento"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };

  const compra = await prisma.compra.findFirst({
    where: { id: compraId, tenantId },
    select: { id: true, status: true, valorTotalCentavos: true },
  });
  if (!compra) return { error: "Compra não encontrada." };
  if (compra.status === "CANCELADA") return { error: "Compra cancelada, não aceita pagamentos." };

  const valorCentavos = parseCentavos(parsed.data.valorStr);
  if (valorCentavos <= 0) return { error: "Valor deve ser maior que zero." };

  await prisma.pagamento.create({
    data: {
      tenantId,
      tipo:           "SAIDA",
      descricao:      parsed.data.descricao,
      valorCentavos,
      formaPagamento: parsed.data.formaPagamento as any,
      compraId,
    },
  });

  revalidatePath(`/t/${slug}/compras`);
  return {};
}

// ─── Excluir compra (apenas rascunho) ────────────────────────────────────────

export async function excluirCompraAction(
  slug: string,
  compraId: string,
): Promise<{ error?: string }> {
  const tenantId = await resolverTenantId(slug).catch((e) => ({ error: e.message }));
  if (typeof tenantId !== "string") return tenantId as { error: string };

  const compra = await prisma.compra.findFirst({
    where: { id: compraId, tenantId },
    select: { id: true, status: true },
  });
  if (!compra) return { error: "Compra não encontrada." };
  if (compra.status !== "RASCUNHO") {
    return { error: "Só é possível excluir compras em rascunho." };
  }

  await prisma.compra.delete({ where: { id: compraId } });

  revalidatePath(`/t/${slug}/compras`);
  revalidatePath(`/t/${slug}/fornecedores`);
  return {};
}

// ─── Dados para o formulário ──────────────────────────────────────────────────

export async function getDadosNovaCompra(slug: string) {
  const session = await requireSession();
  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(slug)).id
      : session.user.tenantId!;

  const [fornecedores, veiculos] = await Promise.all([
    prisma.fornecedor.findMany({
      where: { tenantId, ativo: true },
      select: { id: true, nome: true, razaoSocial: true, documento: true },
      orderBy: { nome: "asc" },
    }),
    prisma.veiculo.findMany({
      where: {
        tenantId,
        status: { in: ["EM_PREPARACAO", "DISPONIVEL", "NEGOCIANDO"] },
        itensCompra: { none: {} }, // sem compra concluída
      },
      select: {
        id: true, marca: true, modelo: true, versao: true,
        placa: true, anoFabricacao: true, anoModelo: true,
        precoCustoCentavos: true, fornecedorId: true,
        fotos: {
          where: { destaque: true },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { fornecedores, veiculos };
}
