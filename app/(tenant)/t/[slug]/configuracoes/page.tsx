import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";

export const metadata = { title: "Configurações" };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie usuários, papéis, integrações e políticas do tenant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Perfil da loja</CardTitle>
              <Badge>{tenant.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Info label="Nome" value={tenant.nome} />
            <Info label="Razão social" value={tenant.razaoSocial ?? "—"} />
            <Info label="Slug" value={`/t/${tenant.slug}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários e permissões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Info label="Usuários" value={totalUsuarios.toString()} />
            <Info label="Papéis definidos" value={totalPapeis.toString()} />
            <Info label="Seu papel" value={session.user.papeis.join(", ") || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Info label="Configuradas" value={totalIntegracoes.toString()} />
            <p className="mt-2 text-xs text-muted-foreground">
              Configure DocuSign, Resend e WhatsApp em{" "}
              <Link href="#" className="underline">
                Integrações
              </Link>{" "}
              (Fase 2/3).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
