import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";

/**
 * Resolve o tenant pelo slug (rota /t/[slug]/...).
 * Cache por requisição via React.cache.
 */
export const resolverTenantPorSlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nome: true,
      razaoSocial: true,
      cnpj: true,
      dominio: true,
      status: true,
      logoUrl: true,
      configJson: true,
      planoId: true,
      leilaoHabilitado:   true,
      whatsappHabilitado: true,
    },
  });
});

/**
 * Idem, mas dispara 404 automaticamente.
 */
export async function requireTenantPorSlug(slug: string) {
  const tenant = await resolverTenantPorSlug(slug);
  if (!tenant || tenant.status === "CANCELADO") {
    notFound();
  }
  return tenant;
}

/**
 * Resolve o tenant e seu WebsiteConfig para a vitrine pública.
 * Inclui o websiteConfig completo para renderização do tema.
 * Cache por requisição via React.cache.
 */
export const resolverWebsite = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nome: true,
      status: true,
      websiteConfig: {
        select: {
          publicado: true,
          tema: true,
          fonte: true,
          corPrimaria: true,
          corDestaque: true,
          logoUrl: true,
          faviconUrl: true,
          heroTitulo: true,
          heroSubtitulo: true,
          sobre: true,
          telefone: true,
          whatsapp: true,
          endereco: true,
          instagram: true,
          facebook: true,
          youtube: true,
          tiktok: true,
          linkedin: true,
          x: true,
          seoTitulo: true,
          seoDescricao: true,
        },
      },
    },
  });
});

/**
 * Resolve o website do tenant: 404 se não existir, cancelado ou não publicado.
 */
export async function requireWebsite(slug: string) {
  const tenant = await resolverWebsite(slug);
  if (!tenant || tenant.status === "CANCELADO") notFound();
  if (!tenant.websiteConfig?.publicado) notFound();
  return tenant as typeof tenant & {
    websiteConfig: NonNullable<(typeof tenant)["websiteConfig"]>;
  };
}
