"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

const planoSchema = z.object({
  nome:                  z.string().min(2, "Nome obrigatório"),
  slug:                  z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: minúsculas, números e hifens"),
  descricao:             z.string().optional(),
  precoMensalStr:        z.string().default("0"),
  precoAnualStr:         z.string().default("0"),
  limiteUsuarios:        z.coerce.number().int().default(5),
  limiteVeiculos:        z.coerce.number().int().default(50),
  limiteStorageMB:       z.coerce.number().int().default(1024),
  limitePlacasMes:       z.coerce.number().int().default(100),
  limiteCnpjsMes:        z.coerce.number().int().default(50),
  limiteClientesMes:     z.coerce.number().int().default(200),
  ativo:                 z.coerce.boolean().default(true),
});

function parseCentavos(s: string): number {
  return Math.round(parseFloat((s || "0").replace(/\./g, "").replace(",", ".")) * 100) || 0;
}

async function assertAdmin() {
  await requireScope("PLATAFORMA");
}

export async function criarPlanoAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  await assertAdmin();
  const parsed = planoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const { precoMensalStr, precoAnualStr, ...rest } = parsed.data;

  try {
    const plano = await prisma.plano.create({
      data: {
        ...rest,
        precoMensalCentavos: parseCentavos(precoMensalStr),
        precoAnualCentavos:  parseCentavos(precoAnualStr),
        ativo: rest.ativo ?? true,
      },
      select: { id: true },
    });
    revalidatePath("/admin/planos");
    return { id: plano.id };
  } catch {
    return { error: "Já existe um plano com este nome ou slug." };
  }
}

export async function atualizarPlanoAction(
  id: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = planoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const { precoMensalStr, precoAnualStr, ...rest } = parsed.data;

  await prisma.plano.update({
    where: { id },
    data: {
      ...rest,
      precoMensalCentavos: parseCentavos(precoMensalStr),
      precoAnualCentavos:  parseCentavos(precoAnualStr),
    },
  });
  revalidatePath("/admin/planos");
  return {};
}

export async function excluirPlanoAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  const tenants = await prisma.tenant.count({ where: { planoId: id } });
  if (tenants > 0)
    return { error: `Este plano tem ${tenants} tenant(s) vinculado(s). Migre-os antes de excluir.` };
  await prisma.plano.delete({ where: { id } });
  revalidatePath("/admin/planos");
  return {};
}
