import { prisma } from "@/lib/db/client";
import type { FonteConsulta } from "./cnpj";

/**
 * Consulta de CEP (ViaCEP) com cache compartilhado da plataforma.
 * Mesma estratégia cache-aside do CNPJ, porém o cache de CEP não expira:
 * uma vez consultado, responde sempre do banco.
 */

export interface ConsultaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  fonte: FonteConsulta;
}

export class CepError extends Error {}

export async function consultarCep(cepDigitos: string): Promise<ConsultaCep> {
  const cached = await prisma.cepCache.findUnique({ where: { cep: cepDigitos } });

  if (cached) {
    return {
      logradouro: cached.logradouro ?? "",
      bairro: cached.bairro ?? "",
      cidade: cached.cidade ?? "",
      uf: cached.uf ?? "",
      fonte: "cache",
    };
  }

  let data: any;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigitos}/json/`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    throw new CepError("Erro ao consultar o CEP. Tente novamente.");
  }

  if (data.erro) {
    throw new CepError("CEP não encontrado.");
  }

  const resultado = {
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf: data.uf ?? "",
  };

  await prisma.cepCache.upsert({
    where: { cep: cepDigitos },
    create: { cep: cepDigitos, ...resultado },
    update: resultado,
  });

  return { ...resultado, fonte: "api" };
}
