import { prisma } from "@/lib/db/client";
import { mapearResposta } from "./mapper";
import type { PlacaApiResponse, PlacaDados } from "./types";

const API_BASE = "https://wdapi2.com.br/consulta";
const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 dias em ms

/** Normaliza placa para chave de cache: sem hífen, uppercase */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ─── Resultado tipado ────────────────────────────────────────────────────────

export type ConsultaPlacaResult =
  | { status: "encontrado"; dados: PlacaDados; fromCache: boolean }
  | { status: "nao_encontrado" }
  | { status: "erro"; mensagem: string };

// ─── Função principal ────────────────────────────────────────────────────────

export async function consultarPlaca(
  placaBruta: string,
): Promise<ConsultaPlacaResult> {
  const placa = normalizarPlaca(placaBruta);

  if (placa.length < 7) {
    return { status: "nao_encontrado" };
  }

  // 1. Verificar cache
  const cached = await prisma.placaCache.findUnique({ where: { placa } });
  if (cached) {
    const age = Date.now() - cached.consultadoEm.getTime();
    if (age < TTL_MS) {
      const payload = cached.payload as PlacaApiResponse;
      if (payload.message) {
        return { status: "nao_encontrado" };
      }
      return {
        status: "encontrado",
        dados: mapearResposta(placa, payload),
        fromCache: true,
      };
    }
  }

  // 2. Chamar API
  const token = process.env.API_PLACAS_TOKEN;
  if (!token) {
    return { status: "erro", mensagem: "Token da API de placas não configurado." };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${placa}/${token}`, {
      next: { revalidate: 0 },
    });
  } catch {
    return { status: "erro", mensagem: "Erro de rede ao consultar API de placas." };
  }

  // Placa não encontrada ou inválida
  if (response.status === 401 || response.status === 406) {
    // Armazenar no cache para evitar consultas desnecessárias
    await prisma.placaCache.upsert({
      where: { placa },
      update: { payload: { message: "nao_encontrado" } },
      create: { placa, payload: { message: "nao_encontrado" } },
    });
    return { status: "nao_encontrado" };
  }

  if (response.status === 429) {
    return { status: "erro", mensagem: "Limite de consultas da API atingido." };
  }

  if (!response.ok) {
    return {
      status: "erro",
      mensagem: `API retornou erro ${response.status}.`,
    };
  }

  let json: PlacaApiResponse;
  try {
    json = await response.json();
  } catch {
    return { status: "erro", mensagem: "Resposta inválida da API de placas." };
  }

  // Resposta de erro embutida no JSON (fallback para APIs legadas)
  // A API real indica sucesso com mensagemRetorno: "Sem erros." e campo `placa` preenchido.
  const semDados = !json.placa && !json.MODELO && !json.modelo;
  if (semDados) {
    await prisma.placaCache.upsert({
      where: { placa },
      update: { payload: { message: "nao_encontrado" } },
      create: { placa, payload: { message: "nao_encontrado" } },
    });
    return { status: "nao_encontrado" };
  }

  // 3. Persistir no cache
  await prisma.placaCache.upsert({
    where: { placa },
    update: { payload: json as object },
    create: { placa, payload: json as object },
  });

  return {
    status: "encontrado",
    dados: mapearResposta(placa, json),
    fromCache: false,
  };
}
