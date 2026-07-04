/**
 * Central plan limit checker.
 * All server actions that consume plan resources call verificarLimite() first.
 * Returns { permitido, usado, limite, pct, planoNome } — callers decide what to do.
 */

import { cache } from "react";
import { prisma } from "@/lib/db/client";

export type TipoRecurso =
  | "veiculos"
  | "usuarios"
  | "placas"   // per month
  | "cnpjs"    // per month
  | "storage"; // bytes vs MB

export interface LimiteInfo {
  permitido:  boolean;
  usado:      number;
  limite:     number; // -1 = unlimited
  pct:        number; // 0-100 (or >100 when exceeded)
  planoNome:  string;
  recurso:    TipoRecurso;
}

/** Cached per-request tenant plan — avoids repeated DB hits. */
const getTenantPlano = cache(async (tenantId: string) => {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      storageUsadoBytes: true,
      plano: {
        select: {
          nome:             true,
          limiteVeiculos:   true,
          limiteUsuarios:   true,
          limitePlacasMes:  true,
          limiteCnpjsMes:   true,
          limiteStorageMB:  true,
        },
      },
    },
  });
});

function calcPct(usado: number, limite: number): number {
  if (limite === -1 || limite === 0) return 0;
  return Math.round((usado / limite) * 100);
}

export async function verificarLimite(
  tenantId: string,
  recurso: TipoRecurso,
): Promise<LimiteInfo> {
  const tenant = await getTenantPlano(tenantId);
  const plano  = tenant?.plano;
  const planoNome = plano?.nome ?? "sem plano";

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  let usado  = 0;
  let limite = 1; // block by default when no plan

  switch (recurso) {
    case "veiculos": {
      limite = plano?.limiteVeiculos ?? 1;
      if (limite !== -1) {
        usado = await prisma.veiculo.count({ where: { tenantId } });
      }
      break;
    }
    case "usuarios": {
      limite = plano?.limiteUsuarios ?? 1;
      if (limite !== -1) {
        usado = await prisma.usuario.count({ where: { tenantId, ativo: true } });
      }
      break;
    }
    case "placas": {
      limite = plano?.limitePlacasMes ?? 0;
      if (limite !== -1) {
        usado = await prisma.registroEvento.count({
          where: {
            tenantId,
            createdAt: { gte: inicioMes },
            tipoEvento: { slug: "consulta_placa" },
          },
        });
      }
      break;
    }
    case "cnpjs": {
      limite = plano?.limiteCnpjsMes ?? 0;
      if (limite !== -1) {
        usado = await prisma.registroEvento.count({
          where: {
            tenantId,
            createdAt: { gte: inicioMes },
            tipoEvento: { slug: "consulta_cnpj" },
          },
        });
      }
      break;
    }
    case "storage": {
      // limiteStorageMB in MB, storageUsadoBytes in bytes
      const limMB = plano?.limiteStorageMB ?? 0;
      limite = limMB === -1 ? -1 : limMB * 1024 * 1024; // convert to bytes
      usado  = tenant?.storageUsadoBytes ?? 0;
      break;
    }
  }

  const permitido = limite === -1 || usado < limite;
  return { permitido, usado, limite, pct: calcPct(usado, limite), planoNome, recurso };
}

/** Returns all resource usages for a tenant in one shot (dashboard widget). */
export async function getUsoCompleto(tenantId: string): Promise<{
  veiculos:  LimiteInfo;
  usuarios:  LimiteInfo;
  placas:    LimiteInfo;
  cnpjs:     LimiteInfo;
  storage:   LimiteInfo;
  alertas:   TipoRecurso[]; // resources at >= 80%
}> {
  const [veiculos, usuarios, placas, cnpjs, storage] = await Promise.all([
    verificarLimite(tenantId, "veiculos"),
    verificarLimite(tenantId, "usuarios"),
    verificarLimite(tenantId, "placas"),
    verificarLimite(tenantId, "cnpjs"),
    verificarLimite(tenantId, "storage"),
  ]);

  const alertas: TipoRecurso[] = [];
  for (const info of [veiculos, usuarios, placas, cnpjs, storage]) {
    if (info.limite !== -1 && info.pct >= 80) alertas.push(info.recurso);
  }

  return { veiculos, usuarios, placas, cnpjs, storage, alertas };
}
