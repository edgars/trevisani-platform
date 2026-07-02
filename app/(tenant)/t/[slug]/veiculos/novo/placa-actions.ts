"use server";

import { requireSession } from "@/lib/auth/session";
import { consultarPlaca } from "@/lib/integrations/placa/consultar";
import type { ConsultaPlacaResult } from "@/lib/integrations/placa/consultar";

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

  return consultarPlaca(placa);
}
