/**
 * Fire-and-forget event tracking.
 * All functions intentionally swallow errors so they never
 * block or crash the main user flow.
 */

import { prisma } from "@/lib/db/client";

/** Record a billable event for a tenant (non-blocking). */
export function registrarEvento(
  tenantId: string,
  eventoSlug: string,
  metadata?: Record<string, unknown>,
): void {
  void (async () => {
    try {
      const tipo = await prisma.tipoEvento.findUnique({
        where: { slug: eventoSlug, ativo: true },
        select: { id: true, precoCentavos: true },
      });
      if (!tipo) return;

      // Determine whether this event is inside the tenant's plan limit
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          plano: {
            select: {
              limitePlacasMes: true,
              limiteCnpjsMes: true,
            },
          },
        },
      });

      let valorCentavos = 0;
      // Simple heuristic: if plan limit is -1 (unlimited) or the plan
      // includes this event type, we mark 0 cost. Otherwise use list price.
      if (tipo.precoCentavos > 0 && tenant?.plano) {
        const plano = tenant.plano;
        if (eventoSlug === "consulta_placa" && plano.limitePlacasMes !== -1) {
          // Could check monthly usage vs limit — for now just record at list price
          valorCentavos = tipo.precoCentavos;
        } else if (eventoSlug === "consulta_cnpj" && plano.limiteCnpjsMes !== -1) {
          valorCentavos = tipo.precoCentavos;
        }
      }

      await prisma.registroEvento.create({
        data: {
          tenantId,
          tipoEventoId: tipo.id,
          valorCentavos,
          ...(metadata ? { metadataJson: metadata as import("@prisma/client").Prisma.InputJsonValue } : {}),
        },
      });
    } catch {
      // Silently ignored — tracking must never break the app
    }
  })();
}

/** Update tenant storage usage counter (non-blocking). */
export function atualizarStorageTenant(
  tenantId: string,
  deltaBytes: number,  // positive = add, negative = remove
): void {
  void (async () => {
    try {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { storageUsadoBytes: { increment: deltaBytes } },
      });
    } catch {
      // Silently ignored
    }
  })();
}
