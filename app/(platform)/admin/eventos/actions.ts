"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

const tipoEventoSchema = z.object({
  slug:          z.string().min(2).regex(/^[a-z0-9_]+$/, "Slug: minúsculas, números e underscores"),
  nome:          z.string().min(2),
  descricao:     z.string().optional(),
  precoCentavos: z.coerce.number().int().min(0).default(0),
  ativo:         z.coerce.boolean().default(true),
});

async function assertAdmin() { await requireScope("PLATAFORMA"); }

export async function criarTipoEventoAction(
  _prev: { error?: string } | null,
  fd: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = tipoEventoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  try {
    await prisma.tipoEvento.create({ data: parsed.data });
    revalidatePath("/admin/eventos");
    return {};
  } catch {
    return { error: "Já existe um tipo de evento com este slug." };
  }
}

export async function atualizarTipoEventoAction(
  id: string,
  _prev: { error?: string } | null,
  fd: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();
  const parsed = tipoEventoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };
  await prisma.tipoEvento.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/eventos");
  return {};
}

export async function excluirTipoEventoAction(id: string): Promise<{ error?: string }> {
  await assertAdmin();
  const count = await prisma.registroEvento.count({ where: { tipoEventoId: id } });
  if (count > 0) return { error: `Existem ${count} registro(s) deste evento. Desative ao invés de excluir.` };
  await prisma.tipoEvento.delete({ where: { id } });
  revalidatePath("/admin/eventos");
  return {};
}

export async function seedTiposEventoPadraoAction(): Promise<void> {
  await assertAdmin();
  const defaults = [
    { slug: "consulta_placa", nome: "Consulta de Placa", descricao: "Chamada à API de consulta de placas veiculares", precoCentavos: 5 },
    { slug: "consulta_cnpj",  nome: "Consulta de CNPJ",  descricao: "Chamada à BrasilAPI para dados de CNPJ",            precoCentavos: 2 },
    { slug: "upload_arquivo", nome: "Upload de Arquivo", descricao: "Upload de qualquer arquivo (foto, documento etc.)",  precoCentavos: 0 },
    { slug: "envio_whatsapp", nome: "Envio WhatsApp",    descricao: "Mensagem enviada via API de WhatsApp",               precoCentavos: 10 },
  ];
  for (const d of defaults) {
    await prisma.tipoEvento.upsert({
      where: { slug: d.slug },
      update: {},
      create: d,
    });
  }
  revalidatePath("/admin/eventos");
}
