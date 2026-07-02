import type { TemaWebsite } from "@prisma/client";
import type { WebsiteConfigData } from "@/lib/website/types";
import { ClassicoLayout } from "./classico";
import { ModernoLayout } from "./moderno";
import { MinimalLayout } from "./minimal";

export interface ThemeLayoutProps {
  config: WebsiteConfigData;
  tenantNome: string;
  tenantSlug: string;
  children: React.ReactNode;
}

export const TEMA_LABELS: Record<TemaWebsite, string> = {
  CLASSICO: "Clássico",
  MODERNO: "Moderno",
  MINIMAL: "Minimal",
};

export const TEMA_DESCRIPTIONS: Record<TemaWebsite, string> = {
  CLASSICO: "Layout tradicional com header branco, footer escuro e cores vibrantes.",
  MODERNO: "Visual dark premium, ideal para lojas de carros de alto padrão.",
  MINIMAL: "Design clean e minimalista, foco total no estoque.",
};

export function ThemeLayout({ config, tenantNome, tenantSlug, children }: ThemeLayoutProps) {
  switch (config.tema) {
    case "MODERNO":
      return (
        <ModernoLayout config={config} tenantNome={tenantNome} tenantSlug={tenantSlug}>
          {children}
        </ModernoLayout>
      );
    case "MINIMAL":
      return (
        <MinimalLayout config={config} tenantNome={tenantNome} tenantSlug={tenantSlug}>
          {children}
        </MinimalLayout>
      );
    case "CLASSICO":
    default:
      return (
        <ClassicoLayout config={config} tenantNome={tenantNome} tenantSlug={tenantSlug}>
          {children}
        </ClassicoLayout>
      );
  }
}
