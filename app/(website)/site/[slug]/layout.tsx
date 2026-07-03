import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireWebsite } from "@/lib/tenant/resolver";
import { buildSiteStyles } from "@/lib/website/colors";
import { getFontClass } from "@/lib/website/fonts";
import { ThemeLayout } from "@/lib/website/themes";
import type { WebsiteConfigData } from "@/lib/website/types";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  const cfg = tenant.websiteConfig;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

  return {
    title: {
      default: cfg.seoTitulo ?? `${tenant.nome} – Compra e Venda de Veículos`,
      template: `%s · ${tenant.nome}`,
    },
    description:
      cfg.seoDescricao ??
      `Encontre os melhores veículos na ${tenant.nome}. Estoque sempre renovado.`,
    openGraph: {
      siteName: tenant.nome,
      ...(cfg.logoUrl ? { images: [{ url: cfg.logoUrl }] } : {}),
    },
    alternates: {
      canonical: `https://${slug}.${rootDomain}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: ReactNode;
} & Params) {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  const cfg = tenant.websiteConfig;

  const siteStyles = buildSiteStyles(cfg.corPrimaria, cfg.corDestaque);
  const fontClass = getFontClass(cfg.fonte);

  const configData: WebsiteConfigData = {
    tema: cfg.tema,
    fonte: cfg.fonte,
    corPrimaria: cfg.corPrimaria,
    corDestaque: cfg.corDestaque,
    logoUrl: cfg.logoUrl,
    faviconUrl: cfg.faviconUrl,
    heroTitulo: cfg.heroTitulo,
    heroSubtitulo: cfg.heroSubtitulo,
    sobre: cfg.sobre,
    telefone: cfg.telefone,
    whatsapp: cfg.whatsapp,
    endereco: cfg.endereco,
    instagram: cfg.instagram,
    facebook: cfg.facebook,
    youtube: cfg.youtube,
    tiktok: cfg.tiktok,
    linkedin: cfg.linkedin,
    x: cfg.x,
    seoTitulo: cfg.seoTitulo,
    seoDescricao: cfg.seoDescricao,
    publicado: cfg.publicado,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: siteStyles }} />
      <div className={fontClass}>
        <ThemeLayout
          config={configData}
          tenantNome={tenant.nome}
          tenantSlug={tenant.slug}
        >
          {children}
        </ThemeLayout>
      </div>
    </>
  );
}
