import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Building2, Car, Users, HardDrive, Activity, TrendingUp, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatDate } from "@/lib/utils";
import { TenantStatusForm } from "./tenant-status-form";

export const metadata = { title: "Detalhes do Tenant" };

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function progressColor(pct: number) {
  if (pct < 60) return "bg-emerald-500";
  if (pct < 85) return "bg-amber-500";
  return "bg-red-500";
}

function limitPct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [tenant, todosPlanosAtivos] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id },
      include: {
        plano: true,
        _count: {
          select: {
            usuarios: true,
            veiculos: { where: { status: { not: "VENDIDO" } } },
          },
        },
      },
    }),
    prisma.plano.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { precoMensalCentavos: "asc" },
    }),
  ]);
  if (!tenant) notFound();

  // Monthly event counts
  const [placasMes, cnpjsMes, totalClientes, eventosRecentes] = await prisma.$transaction([
    prisma.registroEvento.count({
      where: {
        tenantId: id,
        tipoEvento: { slug: "consulta_placa" },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.registroEvento.count({
      where: {
        tenantId: id,
        tipoEvento: { slug: "consulta_cnpj" },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.clienteFinal.count({ where: { tenantId: id } }),
    prisma.registroEvento.findMany({
      where: { tenantId: id },
      include: { tipoEvento: { select: { nome: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const storageMB = tenant.storageUsadoBytes / (1024 * 1024);
  const plano = tenant.plano;
  const config = (tenant.configJson as Record<string, string> | null) ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/admin/tenants"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{tenant.nome}</h1>
              <Badge variant={tenant.status === "ATIVO" ? "success" : tenant.status === "TRIAL" ? "warning" : "destructive"}>
                {tenant.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {tenant.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "volante7.com.br"} · criado em {formatDate(tenant.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`https://${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "volante7.com.br"}`} target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />Vitrine
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/${tenant.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />Portal
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Car,      label: "Veículos ativos",    value: tenant._count.veiculos,  limit: plano?.limiteVeiculos },
          { icon: Users,    label: "Usuários",            value: tenant._count.usuarios,  limit: plano?.limiteUsuarios },
          { icon: Activity, label: "Placas consultadas",  value: placasMes,               limit: plano?.limitePlacasMes, hint: "este mês" },
          { icon: Activity, label: "CNPJs consultados",   value: cnpjsMes,                limit: plano?.limiteCnpjsMes,  hint: "este mês" },
        ].map(item => {
          const pct = item.limit != null && item.limit > 0 ? limitPct(item.value, item.limit) : null;
          return (
            <Card key={item.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.hint && <span className="text-[10px] ml-auto">{item.hint}</span>}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold tabular-nums">{item.value.toLocaleString("pt-BR")}</span>
                  {item.limit != null && (
                    <span className="text-xs text-muted-foreground">
                      {item.limit === -1 ? "/ ∞" : `/ ${item.limit.toLocaleString("pt-BR")}`}
                    </span>
                  )}
                </div>
                {pct !== null && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className={`h-1.5 rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{pct}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4" />Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBytes(tenant.storageUsadoBytes)}</p>
            {plano && plano.limiteStorageMB > 0 && (
              <>
                <p className="text-xs text-muted-foreground">de {plano.limiteStorageMB} MB ({plano.nome})</p>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${progressColor(limitPct(storageMB, plano.limiteStorageMB))}`}
                    style={{ width: `${limitPct(storageMB, plano.limiteStorageMB)}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dados do tenant */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />Dados da loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNPJ</span>
              <span className="font-mono text-xs">{tenant.cnpj ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plano</span>
              <span>{plano?.nome ?? "Sem plano"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clientes</span>
              <span>{totalClientes.toLocaleString("pt-BR")}</span>
            </div>
            {config.contato_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-xs truncate max-w-[160px]">{config.contato_email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alterar status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Gerenciar status</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantStatusForm tenantId={id} currentStatus={tenant.status} planos={todosPlanosAtivos} currentPlanoId={tenant.planoId} />
          </CardContent>
        </Card>
      </div>

      {/* Eventos recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos recentes</CardTitle>
          <p className="text-xs text-muted-foreground">Últimas 20 ações registradas</p>
        </CardHeader>
        <CardContent className="p-0">
          {eventosRecentes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum evento ainda.</p>
          ) : (
            <div className="divide-y">
              {eventosRecentes.map(ev => (
                <div key={ev.id} className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{ev.tipoEvento.nome}</span>
                    {ev.metadataJson && (
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        {JSON.stringify(ev.metadataJson).slice(0, 60)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ev.valorCentavos > 0 ? (
                      <Badge variant="default" className="text-[10px]">
                        <TrendingUp className="mr-1 h-2.5 w-2.5" />R$ {(ev.valorCentavos / 100).toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Gratuito</Badge>
                    )}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
