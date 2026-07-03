"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import {
  GERAIS_BUCKET,
  getPublicUrl,
  uploadFotoChecklist,
} from "@/lib/storage/supabase";

// ─── Helper: resolve tenantId e verifica ownership ───────────────────────────

async function resolveTenant(slug: string): Promise<string> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    throw new Error("Sem permissão.");
  }
  return session.user.escopo === "PLATAFORMA"
    ? (await requireTenantPorSlug(slug)).id
    : session.user.tenantId!;
}

async function assertVeiculoOwnership(
  veiculoId: string,
  tenantId: string,
): Promise<void> {
  const v = await prisma.veiculo.findFirst({ where: { id: veiculoId, tenantId } });
  if (!v) throw new Error("Veículo não encontrado.");
}

// ─── Criar checklist (com 4 itens padrão) ────────────────────────────────────

export async function criarChecklistAction(
  slug: string,
  veiculoId: string,
): Promise<{ error?: string; id?: string }> {
  try {
    const tenantId = await resolveTenant(slug);
    await assertVeiculoOwnership(veiculoId, tenantId);

    const count = await prisma.checklistVeiculo.count({ where: { veiculoId } });

    const checklist = await prisma.checklistVeiculo.create({
      data: {
        veiculoId,
        titulo: `Inspeção #${count + 1}`,
        itens: {
          create: [
            { categoria: "LATARIA" },
            { categoria: "MOTOR" },
            { categoria: "PNEUS" },
            { categoria: "ESTOFADO" },
          ],
        },
      },
      include: { itens: true },
    });

    revalidatePath(`/t/${slug}/veiculos/${veiculoId}/editar`);
    return { id: checklist.id };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Atualizar status de um item (ok / nao ok / pendente) ────────────────────

export async function atualizarItemChecklistAction(
  slug: string,
  itemId: string,
  ok: boolean | null,
  observacao?: string,
): Promise<{ error?: string }> {
  try {
    const tenantId = await resolveTenant(slug);

    // Garante que o item pertence a um veículo do tenant
    const item = await prisma.itemChecklist.findFirst({
      where: { id: itemId },
      include: { checklist: { include: { veiculo: { select: { tenantId: true, id: true } } } } },
    });
    if (!item || item.checklist.veiculo.tenantId !== tenantId) {
      return { error: "Item não encontrado." };
    }

    await prisma.itemChecklist.update({
      where: { id: itemId },
      data: {
        ok,
        observacao: observacao ?? item.observacao,
        dataVerificacao: ok !== null ? new Date() : null,
      },
    });

    revalidatePath(
      `/t/${slug}/veiculos/${item.checklist.veiculo.id}/editar`,
    );
    return {};
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Concluir checklist ───────────────────────────────────────────────────────

export async function concluirChecklistAction(
  slug: string,
  checklistId: string,
): Promise<{ error?: string }> {
  try {
    const tenantId = await resolveTenant(slug);

    const checklist = await prisma.checklistVeiculo.findFirst({
      where: { id: checklistId },
      include: {
        itens: { select: { ok: true } },
        veiculo: { select: { tenantId: true, id: true } },
      },
    });
    if (!checklist || checklist.veiculo.tenantId !== tenantId) {
      return { error: "Checklist não encontrado." };
    }

    const todosAvaliados = checklist.itens.every((it) => it.ok !== null);
    if (!todosAvaliados) {
      return { error: "Avalie todos os itens antes de concluir." };
    }

    await prisma.checklistVeiculo.update({
      where: { id: checklistId },
      data: { status: "CONCLUIDO", realizadoEm: new Date() },
    });

    revalidatePath(`/t/${slug}/veiculos/${checklist.veiculo.id}/editar`);
    return {};
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Upload de foto em item ───────────────────────────────────────────────────

export async function adicionarFotoItemAction(
  slug: string,
  itemId: string,
  formData: FormData,
): Promise<{ error?: string; foto?: { id: string; url: string } }> {
  try {
    const tenantId = await resolveTenant(slug);

    const item = await prisma.itemChecklist.findFirst({
      where: { id: itemId },
      include: {
        checklist: {
          include: { veiculo: { select: { tenantId: true, id: true } } },
        },
      },
    });
    if (!item || item.checklist.veiculo.tenantId !== tenantId) {
      return { error: "Item não encontrado." };
    }

    const file = formData.get("foto") as File | null;
    if (!file) return { error: "Arquivo não enviado." };

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) return { error: "Foto muito grande (máx 5 MB)." };

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = allowedTypes[file.type];
    if (!ext) return { error: "Formato inválido. Use JPEG, PNG ou WebP." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const veiculoId = item.checklist.veiculo.id;
    const storagePath = await uploadFotoChecklist(
      tenantId,
      veiculoId,
      item.checklistId,
      itemId,
      buffer,
      file.type,
      ext,
    );

    const url = getPublicUrl(GERAIS_BUCKET, storagePath);

    const foto = await prisma.fotoItemChecklist.create({
      data: { itemId, url, storagePath },
    });

    revalidatePath(`/t/${slug}/veiculos/${veiculoId}/editar`);
    return { foto: { id: foto.id, url: foto.url } };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// ─── Remover foto de item ─────────────────────────────────────────────────────

export async function removerFotoItemAction(
  slug: string,
  fotoId: string,
): Promise<{ error?: string }> {
  try {
    const tenantId = await resolveTenant(slug);

    const foto = await prisma.fotoItemChecklist.findFirst({
      where: { id: fotoId },
      include: {
        item: {
          include: {
            checklist: {
              include: { veiculo: { select: { tenantId: true, id: true } } },
            },
          },
        },
      },
    });
    if (!foto || foto.item.checklist.veiculo.tenantId !== tenantId) {
      return { error: "Foto não encontrada." };
    }

    await prisma.fotoItemChecklist.delete({ where: { id: fotoId } });
    revalidatePath(
      `/t/${slug}/veiculos/${foto.item.checklist.veiculo.id}/editar`,
    );
    return {};
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
