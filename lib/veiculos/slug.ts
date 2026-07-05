import { prisma } from "@/lib/db/client";
import { slugify } from "@/lib/tenant/slugs";

/**
 * Gera um slug amigável e único (por loja) para a página pública do veículo.
 *
 * Formato: `marca-modelo-versao-ano`, com sufixo numérico em caso de colisão
 * (comum: a mesma loja tem vários carros idênticos em estoque).
 * Ex.: `honda-civic-2020`, `honda-civic-2020-2`, `honda-civic-2020-3`...
 */
export async function gerarSlugVeiculoUnico(params: {
  tenantId: string;
  marca: string;
  modelo: string;
  versao?: string | null;
  anoModelo: number;
  /** Ao regerar o slug de um veículo já existente, exclui o próprio id da checagem. */
  excluirId?: string;
}): Promise<string> {
  const { tenantId, marca, modelo, versao, anoModelo, excluirId } = params;

  let base = slugify(`${marca} ${modelo} ${versao ?? ""} ${anoModelo}`);
  if (base.length < 3) base = slugify(`veiculo-${marca}-${modelo}`) || "veiculo";

  let candidato = base;
  let tentativa = 1;

  while (true) {
    const existe = await prisma.veiculo.findFirst({
      where: {
        tenantId,
        slug: candidato,
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { id: true },
    });
    if (!existe) return candidato;
    tentativa += 1;
    candidato = `${base}-${tentativa}`;
  }
}
