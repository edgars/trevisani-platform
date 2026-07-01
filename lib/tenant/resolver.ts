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
      status: true,
      logoUrl: true,
      configJson: true,
      planoId: true,
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
