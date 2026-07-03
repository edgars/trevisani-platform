"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";

const configSchema = z.object({
  regimeTributario:       z.enum(["mei", "simples", "lucro_presumido", "lucro_real"]),
  aliquotaImpostosPct:    z.coerce.number().min(0).max(100),
  overheadMensalStr:      z.string().default("0"),
});

function parseCentavos(s: string) {
  return Math.round(parseFloat((s || "0").replace(/\./g, "").replace(",", ".")) * 100) || 0;
}

async function getTenantId() {
  const s = await requireSession();
  return s.user.tenantId!;
}

export async function salvarConfiguracaoFiscalAction(
  _prev: { error?: string } | null,
  fd: FormData,
): Promise<{ error?: string }> {
  const tenantId = await getTenantId();
  const parsed = configSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const { overheadMensalStr, ...rest } = parsed.data;

  await prisma.configuracaoFiscal.upsert({
    where:  { tenantId },
    create: { tenantId, ...rest, overheadMensalCentavos: parseCentavos(overheadMensalStr) },
    update: { ...rest, overheadMensalCentavos: parseCentavos(overheadMensalStr) },
  });

  revalidatePath(`/t/${(await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug}/financeiro/configuracao`);
  return {};
}
