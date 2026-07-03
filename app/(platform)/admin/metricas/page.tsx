import { Activity, Building2, Car, HardDrive, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Métricas globais" };
export const dynamic = "force-dynamic";

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  const mb = b / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export default async function MetricasPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalTenants,
    tenantsAtivos,
    totalVeiculos,
    totalUsuarios,
    totalClientes,
    storageAgg,
    // Events this month
    placasMes,
    cnpjsMes,
    // Revenue estimation (from plans × tenants)
    tenantsComPlano,
    // Top consumers this month
    topConsumers,
    // Events grouped by day for last 30 days
    eventosRecentes,
    // Per-plan breakdown
    planBreakdown,
  ] = await prisma.$transaction([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ATIVO" } }),
    prisma.veiculo.count(),
    prisma.usuario.count({ where: { escopo: "STAFF" } }),
    prisma.clienteFinal.count(),
    prisma.tenant.aggregate({ _sum: { storageUsadoBytes: true } }),
    prisma.registroEvento.count({
      where: { tipoEvento: { slug: "consulta_placa" }, createdAt: { gte: startOfMonth } },
    }),
    prisma.registroEvento.count({
      where: { tipoEvento: { slug: "consulta_cnpj" }, createdAt: { gte: startOfMonth } },
    }),
    prisma.tenant.findMany({
      where: { planoId: { not: null }, status: "ATIVO" },
      include: { plano: { select: { precoMensalCentavos: true } } },
    }),
    // Top tenants by event count this month
    prisma.registroEvento.groupBy({
      by: ["tenantId"],
      _count: { id: true },
      where: { createdAt: { gte: startOfMonth } },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.registroEvento.groupBy({
      by: ["tipoEventoId"],
      _count: { id: true },
      where: { createdAt: { gte: startOfMonth } },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.plano.findMany({
      include: { _count: { select: { tenants: true } } },
      orderBy: { precoMensalCentavos: "asc" },
    }),
  ]);

  // Compute MRR
  const mrr = tenantsComPlano.reduce((acc, t) => acc + (t.plano?.precoMensalCentavos ?? 0), 0);

  // Fetch top tenant names
  const topTenantIds = topConsumers.map(t => t.tenantId);
  const topTenants = topTenantIds.length > 0
    ? await prisma.tenant.findMany({ where: { id: { in: topTenantIds } }, select: { id: true, nome: true, slug: true } })
    : [];
  const tenantMap = Object.fromEntries(topTenants.map(t => [t.id, t]));

  // Fetch event type names
  const tipoIds = eventosRecentes.map(e => e.tipoEventoId);
  const tipos = tipoIds.length > 0
    ? await prisma.tipoEvento.findMany({ where: { id: { in: tipoIds } }, select: { id: true, nome: true } })
    : [];
  const tipoMap = Object.fromEntries(tipos.map(t => [t.id, t.nome]));

  const totalStorageBytes = storageAgg._sum.storageUsadoBytes ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métricas globais</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada de toda a plataforma — {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[
          { icon: Building2, label: "Tenants ativos",      value: tenantsAtivos,   sub: `de ${totalTenants} total` },
          { icon: TrendingUp, label: "MRR estimado",        value: formatCentavos(mrr), sub: "planos ativos" },
          { icon: Car,       label: "Veículos cadastrados", value: totalVeiculos.toLocaleString("pt-BR"),  sub: "todas as lojas" },
          { icon: Users,     label: "Clientes cadastrados", value: totalClientes.toLocaleString("pt-BR"),  sub: "todas as lojas" },
          { icon: HardDrive, label: "Storage total",        value: formatBytes(totalStorageBytes), sub: "todas as lojas" },
          { icon: Activity,  label: "Consultas placa/mês",  value: placasMes.toLocaleString("pt-BR"),    sub: "este mês" },
          { icon: Activity,  label: "Consultas CNPJ/mês",   value: cnpjsMes.toLocaleString("pt-BR"),     sub: "este mês" },
          { icon: Users,     label: "Usuários operacionais", value: totalUsuarios.toLocaleString("pt-BR"), sub: "todos os tenants" },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Plan distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
            ) : (
              planBreakdown.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{p.nome}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{p.slug}</Badge>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm tabular-nums">{p._count.tenants} tenants</span>
                    <span className="text-xs text-muted-foreground">{formatCentavos(p.precoMensalCentavos)}/mês</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top event consumers this month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top tenants por eventos (este mês)</CardTitle>
          </CardHeader>
          <CardContent>
            {topConsumers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {topConsumers.map((tc, i) => {
                  const t = tenantMap[tc.tenantId];
                  return (
                    <div key={tc.tenantId} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-sm font-medium">{t?.nome ?? tc.tenantId}</span>
                        {t && <span className="text-xs text-muted-foreground">{t.slug}</span>}
                      </div>
                      <Badge variant="outline" className="tabular-nums text-xs">
                        {(tc._count as { id: number }).id} eventos
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event types breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume de eventos por tipo (este mês)</CardTitle>
        </CardHeader>
        <CardContent>
          {eventosRecentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda. Configure os tipos em &ldquo;Tipos de Evento&rdquo;.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {eventosRecentes.map(ev => (
                <div key={ev.tipoEventoId} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{tipoMap[ev.tipoEventoId] ?? ev.tipoEventoId}</p>
                    <p className="text-xs text-muted-foreground">este mês</p>
                  </div>
                  <span className="text-xl font-bold tabular-nums">{(ev._count as { id: number }).id.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
