"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { solicitarUpgradeManual } from "@/lib/tenant/upgrade";

export async function solicitarUpgradeAction(
  tenantSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSession();
  const tenant = await requireTenantPorSlug(tenantSlug);

  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { ok: false, error: "Sem permissão." };
  }
  if (session.user.escopo === "STAFF" && session.user.tenantId !== tenant.id) {
    return { ok: false, error: "Sem permissão." };
  }

  const result = await solicitarUpgradeManual(tenant.id);
  if (!result.ok) return result;

  revalidatePath(`/t/${tenantSlug}/configuracoes/plano`);
  return { ok: true };
}
