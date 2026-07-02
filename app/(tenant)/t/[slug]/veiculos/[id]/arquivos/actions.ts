"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { deletarArquivo, DOCS_BUCKET } from "@/lib/storage/supabase";

async function resolverTenantId(slug: string, session: Awaited<ReturnType<typeof requireSession>>) {
  return session.user.escopo === "PLATAFORMA"
    ? (await requireTenantPorSlug(slug)).id
    : session.user.tenantId!;
}

export async function excluirDocumentoAction(
  slug: string,
  veiculoId: string,
  documentoId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const doc = await prisma.documentoVeiculo.findFirst({
    where: { id: documentoId, veiculoId, veiculo: { tenantId } },
  });
  if (!doc) return { error: "Documento não encontrado." };

  await prisma.documentoVeiculo.delete({ where: { id: documentoId } });

  try {
    await deletarArquivo(DOCS_BUCKET, doc.storagePath);
  } catch {
    // remoção no storage é silenciosa se falhar
  }

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/arquivos`);
  return {};
}

export async function salvarAnotacaoTagsAction(
  slug: string,
  veiculoId: string,
  documentoId: string,
  anotacao: string,
  tags: string[],
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const doc = await prisma.documentoVeiculo.findFirst({
    where: { id: documentoId, veiculoId, veiculo: { tenantId } },
    select: { id: true },
  });
  if (!doc) return { error: "Documento não encontrado." };

  await prisma.documentoVeiculo.update({
    where: { id: documentoId },
    data: {
      anotacao: anotacao.trim() || null,
      tags: tags.map((t) => t.trim()).filter(Boolean),
    },
  });

  return {};
}

export async function atualizarTipoDocumentoAction(
  slug: string,
  veiculoId: string,
  documentoId: string,
  tipo: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const doc = await prisma.documentoVeiculo.findFirst({
    where: { id: documentoId, veiculoId, veiculo: { tenantId } },
  });
  if (!doc) return { error: "Documento não encontrado." };

  await prisma.documentoVeiculo.update({
    where: { id: documentoId },
    data: { tipo: tipo as any },
  });

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/arquivos`);
  return {};
}
