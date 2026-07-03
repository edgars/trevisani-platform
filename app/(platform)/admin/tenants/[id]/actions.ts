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
