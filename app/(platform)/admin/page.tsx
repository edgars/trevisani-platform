import { Building2, Car, CreditCard, Users } from "lucide-react";

import { StatCard } from "@/components/portal/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Plataforma · Visão geral" };

export default async function PlatformDashboardPage() {
  const [tenantsAtivos, totalTenants, totalVeiculos, totalUsuarios, tenantsRecentes, tenantsComPlano] =
    await prisma.$transaction([
      prisma.tenant.count({ where: { status: "ATIVO" } }),
      prisma.tenant.count(),
      prisma.veiculo.count(),
      prisma.usuario.count({ where: { escopo: "STAFF" } }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { plano: true },
      }),
      prisma.tenant.findMany({
        where: { planoId: { not: null }, status: "ATIVO" },
        include: { plano: { select: { precoMensalCentavos: true } } },
      }),
    ]);

  const mrr = tenantsComPlano.reduce((sum, t) => sum + (t.plano?.precoMensalCentavos ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Métricas globais da plataforma AutoGestão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tenants ativos"
          value={tenantsAtivos}
          icon={Building2}
          hint={`de ${totalTenants} no total`}
        />
        <StatCard label="Usuários operacionais" value={totalUsuarios} icon={Users} />
        <StatCard label="Veículos cadastrados" value={totalVeiculos} icon={Car} />
        <StatCard label="MRR estimado" value={formatCentavos(mrr)} icon={CreditCard} hint={`${tenantsComPlano.length} tenants pagantes`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantsRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum tenant cadastrado ainda.</p>
          ) : (
            <div className="divide-y">
              {tenantsRecentes.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{t.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      /t/{t.slug} · {t.plano?.nome ?? "sem plano"}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }> = {
    ATIVO: { label: "Ativo", variant: "success" },
    TRIAL: { label: "Trial", variant: "warning" },
    SUSPENSO: { label: "Suspenso", variant: "destructive" },
    CANCELADO: { label: "Cancelado", variant: "secondary" },
  };
  const cfg = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
