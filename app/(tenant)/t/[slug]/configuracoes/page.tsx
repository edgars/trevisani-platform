import Link from "next/link";
import { Building2, Globe, Settings2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";

import { PerfilForm } from "./perfil-form";

export const metadata = { title: "Configurações" };

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ATIVO:     { label: "Ativo",     variant: "default" },
  TRIAL:     { label: "Trial",     variant: "secondary" },
  SUSPENSO:  { label: "Suspenso",  variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "outline" },
};

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);
  const session = await requireSession();

  const [totalUsuarios, totalPapeis, totalIntegracoes] = await Promise.all([
    prisma.usuario.count({ where: { tenantId: tenant.id } }),
    prisma.papel.count({ where: { tenantId: tenant.id } }),
    prisma.integracaoConfig.count({ where: { tenantId: tenant.id, ativo: true } }),
  ]);

  // Campos extras gravados no configJson
  const config = (tenant.configJson as Record<string, string> | null) ?? {};

  const defaultValues = {
    nome:        tenant.nome,
    razaoSocial: tenant.razaoSocial ?? "",
    cnpj:        tenant.cnpj
      ? tenant.cnpj
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
      : "",
    telefone:    config.telefone ?? "",
    email:       config.emailContato ?? "",
    dominio:     tenant.dominio ?? "",
    logoUrl:     tenant.logoUrl ?? "",
  };

  const statusInfo = STATUS_LABEL[tenant.status] ?? { label: tenant.status, variant: "secondary" as const };

  return (
    <div className="space-y-8">
      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o perfil, contato e presença online da sua loja.
          </p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* ── Grid principal ─────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna esquerda: form (ocupa 2 colunas) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Perfil da loja</CardTitle>
              </div>
              <CardDescription>
                Slug: <code className="rounded bg-muted px-1 text-xs">/t/{slug}</code>
                {" · "}
                O slug não pode ser alterado pelo tenant.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <PerfilForm slug={slug} defaultValues={defaultValues} />
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: cards informativos */}
        <div className="flex flex-col gap-4">
          {/* Usuários e permissões */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Usuários</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Stat label="Usuários ativos" value={totalUsuarios} />
              <Stat label="Papéis definidos" value={totalPapeis} />
              <Stat
                label="Seu papel"
                value={session.user.papeis.join(", ") || "—"}
              />
              <Separator />
              <p className="text-xs text-muted-foreground">
                Gerenciamento de usuários e permissões em breve.
              </p>
            </CardContent>
          </Card>

          {/* Integrações */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Integrações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Stat label="Configuradas" value={totalIntegracoes} />
              <Separator />
              <p className="text-xs text-muted-foreground">
                DocuSign, Resend e WhatsApp disponíveis nas Fases 2 e 3.
              </p>
            </CardContent>
          </Card>

          {/* Site da loja */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Vitrine online</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                Personalize temas, cores, fontes e logo do site da sua loja.
              </p>
              <Link
                href={`/t/${slug}/website`}
                className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Abrir editor de website →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
