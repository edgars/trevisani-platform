"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireScope } from "@/lib/auth/session";

async function assertAdmin() { await requireScope("PLATAFORMA"); }

export async function alterarStatusTenantAction(
  tenantId: string,
  status: string,
): Promise<{ error?: string }> {
  await assertAdmin();
  const valid = ["TRIAL", "ATIVO", "SUSPENSO", "CANCELADO"];
  if (!valid.includes(status)) return { error: "Status inválido." };
  await prisma.tenant.update({ where: { id: tenantId }, data: { status: status as never } });
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/tenants");
  return {};
}

export async function alterarPlanoTenantAction(
  tenantId: string,
  planoId: string,
): Promise<{ error?: string }> {
  await assertAdmin();
  const plano = await prisma.plano.findUnique({ where: { id: planoId }, select: { id: true } });
  if (!plano) return { error: "Plano não encontrado." };
  await prisma.tenant.update({ where: { id: tenantId }, data: { planoId } });
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/tenants");
  return {};
}

export async function alterarDescontoTenantAction(
  tenantId: string,
  desconto: number,
): Promise<{ error?: string }> {
  await assertAdmin();
  if (desconto < 0 || desconto > 100) return { error: "Desconto deve ser entre 0 e 100%." };
  await prisma.tenant.update({ where: { id: tenantId }, data: { descontoPercent: desconto } });
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/metricas");
  return {};
}

export async function alterarFeatureTenantAction(
  tenantId: string,
  feature: "leilaoHabilitado" | "whatsappHabilitado",
  valor: boolean,
): Promise<{ error?: string }> {
  await assertAdmin();
  await prisma.tenant.update({ where: { id: tenantId }, data: { [feature]: valor } });
  revalidatePath(`/admin/tenants/${tenantId}`);
  return {};
}
