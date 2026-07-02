import type { TemaWebsite, FonteWebsite } from "@prisma/client";

export interface WebsiteConfigData {
  tema: TemaWebsite;
  fonte: FonteWebsite;
  corPrimaria: string;
  corDestaque: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  sobre: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  instagram: string | null;
  seoTitulo: string | null;
  seoDescricao: string | null;
  publicado: boolean;
}

export interface TenantWebsiteData {
  id: string;
  slug: string;
  nome: string;
  websiteConfig: WebsiteConfigData | null;
}

export interface VeiculoCard {
  id: string;
  marca: string;
  modelo: string;
  versao: string | null;
  anoFabricacao: number;
  anoModelo: number;
  cor: string | null;
  combustivel: string | null;
  cambio: string | null;
  kmAtual: number | null;
  precoVendaCentavos: number;
  fotos: Array<{ url: string; legenda: string | null; destaque: boolean }>;
}
