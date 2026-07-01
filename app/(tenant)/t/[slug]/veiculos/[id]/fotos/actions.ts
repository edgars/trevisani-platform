"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { deleteFoto } from "@/lib/storage/supabase";

async function resolverTenantId(slug: string, session: Awaited<ReturnType<typeof requireSession>>) {
  if (session.user.escopo === "PLATAFORMA") {
    return (await requireTenantPorSlug(slug)).id;
  }
  return session.user.tenantId!;
}

/** Verifica que a foto pertence ao veículo do tenant */
async function getFotoAutorizada(fotoId: string, veiculoId: string, tenantId: string) {
  return prisma.fotoVeiculo.findFirst({
    where: {
      id: fotoId,
      veiculoId,
      veiculo: { tenantId },
    },
  });
}

export async function excluirFotoAction(
  slug: string,
  veiculoId: string,
  fotoId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const foto = await getFotoAutorizada(fotoId, veiculoId, tenantId);
  if (!foto) return { error: "Foto não encontrada." };

  await prisma.fotoVeiculo.delete({ where: { id: fotoId } });

  // Se era destaque, promove a próxima foto
  if (foto.destaque) {
    const proxima = await prisma.fotoVeiculo.findFirst({
      where: { veiculoId },
      orderBy: { ordem: "asc" },
    });
    if (proxima) {
      await prisma.fotoVeiculo.update({
        where: { id: proxima.id },
        data: { destaque: true },
      });
    }
  }

  // Remove do Supabase
  try {
    await deleteFoto(foto.storagePath);
  } catch {
    // log silencioso — foto já removida do banco
  }

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/fotos`);
  return {};
}

export async function setDestaqueAction(
  slug: string,
  veiculoId: string,
  fotoId: string,
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const foto = await getFotoAutorizada(fotoId, veiculoId, tenantId);
  if (!foto) return { error: "Foto não encontrada." };

  // Remove destaque de todas, define na selecionada
  await prisma.$transaction([
    prisma.fotoVeiculo.updateMany({ where: { veiculoId }, data: { destaque: false } }),
    prisma.fotoVeiculo.update({ where: { id: fotoId }, data: { destaque: true } }),
  ]);

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/fotos`);
  return {};
}

export async function atualizarStatusFotoAction(
  slug: string,
  veiculoId: string,
  fotoId: string,
  status: "BATIDO" | "EM_REPARO" | "PRONTO_VENDA",
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  const foto = await getFotoAutorizada(fotoId, veiculoId, tenantId);
  if (!foto) return { error: "Foto não encontrada." };

  await prisma.fotoVeiculo.update({ where: { id: fotoId }, data: { status: status as any } });

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/fotos`);
  return {};
}

export async function reordenarFotosAction(
  slug: string,
  veiculoId: string,
  fotoIds: string[],
): Promise<{ error?: string }> {
  const session = await requireSession();
  const tenantId = await resolverTenantId(slug, session);

  // Verifica que todas pertencem ao veículo/tenant
  const fotos = await prisma.fotoVeiculo.findMany({
    where: { veiculoId, veiculo: { tenantId }, id: { in: fotoIds } },
    select: { id: true },
  });
  if (fotos.length !== fotoIds.length) return { error: "IDs inválidos." };

  await prisma.$transaction(
    fotoIds.map((id, index) =>
      prisma.fotoVeiculo.update({ where: { id }, data: { ordem: index } }),
    ),
  );

  revalidatePath(`/t/${slug}/veiculos/${veiculoId}/fotos`);
  return {};
}
