"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

async function assertLeilaoEnabled(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { leilaoHabilitado: true },
  });
  if (!tenant?.leilaoHabilitado) throw new Error("Módulo de leilão não habilitado.");
}

const leilaoSchema = z.object({
  titulo:        z.string().min(3, "Título obrigatório"),
  descricao:     z.string().optional(),
  veiculoId:     z.string().optional(),
  precoInicial:  z.coerce.number().min(1, "Preço inicial obrigatório"),
  incrementoMin: z.coerce.number().min(0).default(0),
  dataInicio:    z.string().min(1, "Data de início obrigatória"),
  dataFim:       z.string().min(1, "Data de encerramento obrigatória"),
});

export async function criarLeilaoAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;
  await assertLeilaoEnabled(tenantId);

  const parsed = leilaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const inicio = new Date(d.dataInicio);
  const fim    = new Date(d.dataFim);
  if (fim <= inicio) return { error: "Data de encerramento deve ser após o início." };

  const leilao = await prisma.leilao.create({
    data: {
      tenantId,
      titulo:        d.titulo,
      descricao:     d.descricao ?? null,
      veiculoId:     d.veiculoId || null,
      precoInicial:  Math.round(d.precoInicial * 100),
      precoAtual:    Math.round(d.precoInicial * 100),
      incrementoMin: Math.round(d.incrementoMin * 100),
      dataInicio:    inicio,
      dataFim:       fim,
      status:        inicio <= new Date() ? "ATIVO" : "AGENDADO",
    },
  });

  redirect(`/t/${session.user.tenantSlug}/leiloes/${leilao.id}`);
}

export async function atualizarLeilaoAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const leilao = await prisma.leilao.findUnique({ where: { id }, select: { tenantId: true, status: true } });
  if (!leilao || leilao.tenantId !== tenantId) return { error: "Leilão não encontrado." };
  if (leilao.status === "ENCERRADO" || leilao.status === "CANCELADO") return { error: "Leilão já finalizado." };

  const parsed = leilaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  const inicio = new Date(d.dataInicio);
  const fim    = new Date(d.dataFim);
  if (fim <= inicio) return { error: "Data de encerramento deve ser após o início." };

  await prisma.leilao.update({
    where: { id },
    data: {
      titulo:        d.titulo,
      descricao:     d.descricao ?? null,
      veiculoId:     d.veiculoId || null,
      precoInicial:  Math.round(d.precoInicial * 100),
      incrementoMin: Math.round(d.incrementoMin * 100),
      dataInicio:    inicio,
      dataFim:       fim,
    },
  });

  revalidatePath(`/t/${session.user.tenantSlug}/leiloes/${id}`);
  revalidatePath(`/t/${session.user.tenantSlug}/leiloes`);
  redirect(`/t/${session.user.tenantSlug}/leiloes/${id}`);
}

export async function cancelarLeilaoAction(id: string): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const leilao = await prisma.leilao.findUnique({ where: { id }, select: { tenantId: true, status: true, lances: { take: 1 } } });
  if (!leilao || leilao.tenantId !== tenantId) return { error: "Leilão não encontrado." };
  if (leilao.status === "ENCERRADO") return { error: "Leilão já encerrado." };
  if (leilao.lances.length > 0) return { error: "Não é possível cancelar: já existem lances." };

  await prisma.leilao.update({ where: { id }, data: { status: "CANCELADO" } });
  revalidatePath(`/t/${session.user.tenantSlug}/leiloes`);
  redirect(`/t/${session.user.tenantSlug}/leiloes`);
}

export async function darLanceAction(
  leilaoId: string,
  clienteId: string,
  valorReais: number,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;
  await assertLeilaoEnabled(tenantId);

  return await prisma.$transaction(async (tx) => {
    const leilao = await tx.leilao.findUnique({
      where: { id: leilaoId },
      select: { id: true, tenantId: true, status: true, precoAtual: true, incrementoMin: true, dataFim: true },
    });
    if (!leilao || leilao.tenantId !== tenantId) return { error: "Leilão não encontrado." };
    if (leilao.status !== "ATIVO") return { error: "Leilão não está ativo." };
    if (new Date() > leilao.dataFim) return { error: "O prazo deste leilão encerrou." };

    const valorCentavos = Math.round(valorReais * 100);
    const minimo = leilao.precoAtual + leilao.incrementoMin;
    if (valorCentavos < minimo) {
      return { error: `Lance mínimo: R$ ${(minimo / 100).toFixed(2).replace(".", ",")}` };
    }

    const cliente = await tx.clienteFinal.findFirst({
      where: { id: clienteId, tenantId },
      select: { id: true },
    });
    if (!cliente) return { error: "Cliente não encontrado." };

    await tx.lance.create({ data: { leilaoId, clienteId, valorCentavos } });
    await tx.leilao.update({ where: { id: leilaoId }, data: { precoAtual: valorCentavos } });
    return { ok: true };
  });
}

export async function getLancesAction(leilaoId: string): Promise<{
  lances: { id: string; valorCentavos: number; createdAt: Date; cliente: { nome: string } }[];
  precoAtual: number;
  status: string;
}> {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const leilao = await prisma.leilao.findUnique({
    where: { id: leilaoId },
    select: {
      precoAtual: true,
      status: true,
      lances: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          valorCentavos: true,
          createdAt: true,
          cliente: { select: { nome: true } },
        },
      },
    },
  });

  if (!leilao || (await prisma.tenant.findFirst({ where: { id: tenantId }, select: { id: true } })) === null) {
    return { lances: [], precoAtual: 0, status: "ENCERRADO" };
  }

  return {
    lances:     leilao.lances,
    precoAtual: leilao.precoAtual,
    status:     leilao.status,
  };
}
