import Link from "next/link";
import { Plus, Gavel, Clock, CheckCircle, XCircle, CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { formatCentavos, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leilões" };

const STATUS_META = {
  AGENDADO:  { label: "Agendado",   color: "bg-blue-500",   icon: CalendarClock, badge: "secondary" as const },
  ATIVO:     { label: "Em andamento", color: "bg-emerald-500", icon: Clock,    badge: "success" as const },
  ENCERRADO: { label: "Encerrado",  color: "bg-muted",       icon: CheckCircle, badge: "secondary" as const },
  CANCELADO: { label: "Cancelado",  color: "bg-red-500",     icon: XCircle,   badge: "destructive" as const },
};

export default async function LeioesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant, session] = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.leilaoHabilitado) notFound();

  const leiloes = await prisma.leilao.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      veiculo: { select: { marca: true, modelo: true, anoModelo: true, placa: true } },
      _count: { select: { lances: true } },
    },
  });

  const ativos = leiloes.filter(l => l.status === "ATIVO");
  const agendados = leiloes.filter(l => l.status === "AGENDADO");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gavel className="h-6 w-6" /> Leilões
          </h1>
          <p className="text-sm text-muted-foreground">
            {ativos.length} em andamento · {agendados.length} agendados
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/leiloes/novo`}>
            <Plus className="mr-2 h-4 w-4" /> Novo leilão
          </Link>
        </Button>
      </div>

      {leiloes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Gavel className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-semibold">Nenhum leilão cadastrado</p>
            <p className="text-sm text-muted-foreground">Crie seu primeiro leilão para começar.</p>
            <Button asChild className="mt-2">
              <Link href={`/t/${slug}/leiloes/novo`}><Plus className="mr-2 h-4 w-4" />Criar leilão</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leiloes.map(l => {
          const meta = STATUS_META[l.status];
          const agora = new Date();
          const expirou = agora > l.dataFim && l.status === "ATIVO";
          const emBreve = agora < l.dataInicio;
          return (
            <Link key={l.id} href={`/t/${slug}/leiloes/${l.id}`} className="group block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  {/* Status bar */}
                  <div className="flex items-center justify-between">
                    <Badge variant={meta.badge} className="gap-1">
                      <meta.icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{l._count.lances} lance(s)</span>
                  </div>

                  {/* Title */}
                  <div>
                    <p className="font-semibold leading-tight group-hover:text-primary transition-colors">{l.titulo}</p>
                    {l.veiculo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.veiculo.marca} {l.veiculo.modelo} {l.veiculo.anoModelo}
                        {l.veiculo.placa && ` · ${l.veiculo.placa}`}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lance atual</p>
                      <p className="text-lg font-bold">{formatCentavos(l.precoAtual)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">
                        {l.status === "ENCERRADO" || l.status === "CANCELADO"
                          ? "Encerrado em"
                          : emBreve ? "Inicia em" : "Encerra em"}
                      </p>
                      <p className={`text-xs font-medium ${expirou ? "text-red-500" : ""}`}>
                        {formatDate(l.status === "ENCERRADO" || l.status === "CANCELADO" ? l.dataFim : emBreve ? l.dataInicio : l.dataFim)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
