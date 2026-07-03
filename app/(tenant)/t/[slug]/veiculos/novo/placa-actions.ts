"use server";

import { requireSession } from "@/lib/auth/session";
import { consultarPlaca } from "@/lib/integrations/placa/consultar";
import type { ConsultaPlacaResult } from "@/lib/integrations/placa/consultar";
import { registrarEvento } from "@/lib/tracking/eventos";

/**
 * Server action chamada pelo formulário de cadastro de veículo.
 * Qualquer usuário STAFF ou PLATAFORMA pode consultar.
 */
export async function consultarPlacaAction(
  placa: string,
): Promise<ConsultaPlacaResult> {
  const session = await requireSession();
  if (session.user.escopo !== "STAFF" && session.user.escopo !== "PLATAFORMA") {
    return { status: "erro", mensagem: "Sem permissão para consultar placas." };
  }

  const result = await consultarPlaca(placa);

  // Track event only when the API was actually called (not served from cache)
  if (result.status === "encontrado" && !result.fromCache && session.user.tenantId) {
    registrarEvento(session.user.tenantId, "consulta_placa", { placa: placa.toUpperCase() });
  } else if (result.status === "nao_encontrado" && session.user.tenantId) {
    registrarEvento(session.user.tenantId, "consulta_placa", { placa: placa.toUpperCase(), naoEncontrado: true });
  }

  return result;
}
