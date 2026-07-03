import { prisma } from "@/lib/db/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CnpjDados {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  situacao: "ATIVA" | "BAIXADA" | "INAPTA" | "SUSPENSA" | string;
}

interface BrasilApiCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  descricao_situacao_cadastral?: string;
}

function mapearBrasilApi(raw: BrasilApiCnpj): CnpjDados {
  const tel = raw.ddd_telefone_1 ?? raw.ddd_telefone_2 ?? "";
  return {
    cnpj:         raw.cnpj?.replace(/\D/g, "") ?? "",
    razaoSocial:  raw.razao_social ?? "",
    nomeFantasia: raw.nome_fantasia || undefined,
    email:        raw.email || undefined,
    telefone:     tel ? tel.replace(/\D/g, "") : undefined,
    cep:          raw.cep?.replace(/\D/g, "") || undefined,
    logradouro:   raw.logradouro || undefined,
    numero:       raw.numero || undefined,
    complemento:  raw.complemento || undefined,
    bairro:       raw.bairro || undefined,
    cidade:       raw.municipio || undefined,
    uf:           raw.uf || undefined,
    situacao:     raw.descricao_situacao_cadastral ?? "DESCONHECIDA",
  };
}

/** TTL de 30 dias para cache de CNPJ */
const TTL_DIAS = 30;

// ─── Consulta com cache ──────────────────────────────────────────────────────

export async function consultarCnpj(cnpj: string): Promise<CnpjDados | null> {
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return null;

  // 1. Tenta o cache primeiro
  const cached = await prisma.cnpjCache.findUnique({ where: { cnpj: cnpjLimpo } });
  if (cached) {
    return mapearBrasilApi(cached.payload as unknown as BrasilApiCnpj);
  }

  // 2. Chama a BrasilAPI
  try {
    const res = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      { next: { revalidate: 0 } },
    );
    if (!res.ok) return null;

    const raw: BrasilApiCnpj = await res.json();

    // 3. Persiste no cache
    const payload = raw as unknown as import("@prisma/client").Prisma.InputJsonValue;
    await prisma.cnpjCache.upsert({
      where:  { cnpj: cnpjLimpo },
      create: { cnpj: cnpjLimpo, payload },
      update: { payload },
    });

    return mapearBrasilApi(raw);
  } catch {
    return null;
  }
}

// ─── Formatação de CNPJ para exibição ────────────────────────────────────────

export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function validarCnpj(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(c[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13]);
}
