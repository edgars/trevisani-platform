import { prisma } from "@/lib/db/client";

/**
 * Consulta de CNPJ com cache compartilhado da plataforma (cache-aside).
 *
 * 1. Busca no `cnpj_cache`; hit fresco (< TTL) responde sem chamada externa.
 * 2. Miss ou registro velho: chama a OpenCNPJ e faz upsert no cache.
 * 3. API fora do ar com registro velho disponível: retorna o registro velho
 *    (stale fallback) para a plataforma continuar funcionando.
 */

const TTL_MS = 180 * 24 * 60 * 60 * 1000; // 6 meses

export type FonteConsulta = "cache" | "api" | "cache-stale";

export interface ConsultaCnpj {
  payload: any;
  fonte: FonteConsulta;
}

export class CnpjError extends Error {}

export async function consultarCnpj(cnpjDigitos: string): Promise<ConsultaCnpj> {
  const cached = await prisma.cnpjCache.findUnique({
    where: { cnpj: cnpjDigitos },
  });

  const fresco =
    cached && Date.now() - cached.consultadoEm.getTime() < TTL_MS;
  if (cached && fresco) {
    return { payload: cached.payload, fonte: "cache" };
  }

  let res: Response;
  try {
    res = await fetch(`https://api.opencnpj.org/${cnpjDigitos}?dataset=receita`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    if (cached) return { payload: cached.payload, fonte: "cache-stale" };
    throw new CnpjError("Não foi possível consultar o CNPJ. Tente novamente.");
  }

  if (res.status === 404) {
    throw new CnpjError("CNPJ não encontrado na Receita Federal.");
  }
  if (!res.ok) {
    if (cached) return { payload: cached.payload, fonte: "cache-stale" };
    throw new CnpjError(`Consulta CNPJ indisponível (HTTP ${res.status}).`);
  }

  const payload = await res.json();

  await prisma.cnpjCache.upsert({
    where: { cnpj: cnpjDigitos },
    create: { cnpj: cnpjDigitos, payload },
    update: { payload },
  });

  return { payload, fonte: "api" };
}
