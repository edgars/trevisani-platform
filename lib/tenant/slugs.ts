import { prisma } from "@/lib/db/client";

/** Subdomínios/slugs que nunca podem ser usados por uma loja. */
export const SLUGS_RESERVADOS = new Set([
  "www", "app", "admin", "api", "mail", "smtp", "dashboard",
  "login", "logout", "site", "demo", "suporte", "support",
  "blog", "docs", "status", "static", "cdn", "assets", "cadastro",
  "planos", "confirmar-conta", "esqueci-senha", "redefinir-senha",
]);

/** Normaliza um texto livre (nome da loja) em um slug de subdomínio válido. */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function slugValido(slug: string): boolean {
  return (
    slug.length >= 3 &&
    slug.length <= 40 &&
    /^[a-z0-9-]+$/.test(slug) &&
    !SLUGS_RESERVADOS.has(slug)
  );
}

/**
 * A partir de um nome de loja, gera um slug único no banco (acrescenta
 * sufixo numérico em caso de colisão: `minhaloja`, `minhaloja-2`, ...).
 */
export async function gerarSlugUnico(base: string): Promise<string> {
  let slugBase = slugify(base);
  if (slugBase.length < 3) slugBase = `loja-${slugBase}`.slice(0, 40);
  if (SLUGS_RESERVADOS.has(slugBase)) slugBase = `${slugBase}-loja`;

  let candidato = slugBase;
  let tentativa = 1;

  while (true) {
    const existe = await prisma.tenant.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!existe) return candidato;
    tentativa += 1;
    candidato = `${slugBase}-${tentativa}`.slice(0, 40);
  }
}
