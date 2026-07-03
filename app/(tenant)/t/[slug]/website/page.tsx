import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { WebsiteEditor } from "./website-editor";

export const metadata: Metadata = { title: "Website" };
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function WebsitePage({ params }: Params) {
  const { slug } = await params;
  await requireSession();
  const tenant = await requireTenantPorSlug(slug);

  const websiteConfig = await prisma.websiteConfig.findUnique({
    where: { tenantId: tenant.id },
    select: {
      publicado: true,
      tema: true,
      fonte: true,
      corPrimaria: true,
      corDestaque: true,
      logoUrl: true,
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
  });

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const vitrinUrl = `https://${slug}.${rootDomain}`;

  return (
    <div className="max-w-3xl space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Website da loja</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize a vitrine pública da{" "}
            <strong>{tenant.nome}</strong> em{" "}
            <a
              href={vitrinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs underline underline-offset-2 hover:opacity-70"
            >
              {slug}.{rootDomain}
            </a>
          </p>
        </div>
      </div>

      <div className="pt-4">
        <WebsiteEditor
          slug={slug}
          tenantNome={tenant.nome}
          config={websiteConfig}
        />
      </div>
    </div>
  );
}
