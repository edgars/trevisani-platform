"use server";

import { requireSession } from "@/lib/auth/session";
import { consultarPlaca } from "@/lib/integrations/placa/consultar";
import type { ConsultaPlacaResult } from "@/lib/integrations/placa/consultar";
import { registrarEvento } from "@/lib/tracking/eventos";
import { verificarLimite } from "@/lib/plano/limites";

/**
 * Server action chamada pelo formulário de cadastro de veículo.
 * Qualquer usuário STAFF ou PLATAFORMA pode consultar.
 */
export async function consultarPlacaAction(
  placa: string,
): Promise<ConsultaPlacaResult & { upgradeRequired?: boolean }> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { status: "erro", mensagem: "Sem permissão para consultar placas." };
  }

  // Check limit before hitting the API (cache queries are still free)
  if (session.user.tenantId) {
    const limite = await verificarLimite(session.user.tenantId, "placas");
    if (!limite.permitido) {
      return {
        status: "erro",
        mensagem: `Você atingiu o limite de ${limite.limite} consultas de placa do plano ${limite.planoNome}. Faça upgrade para continuar.`,
        upgradeRequired: true,
      };
    }
  }

  const result = await consultarPlaca(placa);

  // Track only real API calls (not from cache) — cache hits are free
  const fromCache = result.status === "encontrado" ? result.fromCache : false;
  if (!fromCache && session.user.tenantId) {
    if (result.status === "encontrado" || result.status === "nao_encontrado") {
      registrarEvento(session.user.tenantId, "consulta_placa", {
        placa: placa.toUpperCase(),
        naoEncontrado: result.status === "nao_encontrado",
      });
    }
  }

  return result;
}
