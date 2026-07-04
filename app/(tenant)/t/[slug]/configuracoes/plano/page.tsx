import Link from "next/link";
import { AlertTriangle, Car, Check, Database, FileSearch, HardDrive, Users, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos, formatDate } from "@/lib/utils";
import { getUsoCompleto, type LimiteInfo, type TipoRecurso } from "@/lib/plano/limites";
import { UpgradeButton } from "./upgrade-button";

export const metadata = { title: "Plano" };
export const dynamic = "force-dynamic";

const RECURSO_META: Record<TipoRecurso, { label: string; icon: React.ElementType; fmt?: (n: number) => string }> = {
  veiculos: { label: "Veículos no estoque",   icon: Car },
  usuarios: { label: "Usuários ativos",        icon: Users },
  placas:   { label: "Consultas de placa/mês", icon: Database },
  cnpjs:    { label: "Consultas de CNPJ/mês",  icon: FileSearch },
  storage:  { label: "Storage (armazenamento)", icon: HardDrive,
    fmt: (b) => `${(b / 1024 / 1024).toFixed(0)} MB` },
};

function UsageBar({ info }: { info: LimiteInfo }) {
  const meta = RECURSO_META[info.recurso];
  const Icon = meta.icon;
  const ilimitado = info.limite === -1;
  const pct = Math.min(info.pct, 100);

  let barColor = "bg-emerald-500";
  let textColor = "text-emerald-600 dark:text-emerald-400";
  if (pct >= 100) { barColor = "bg-red-500"; textColor = "text-red-600 dark:text-red-400"; }
  else if (pct >= 80) { barColor = "bg-amber-500"; textColor = "text-amber-600 dark:text-amber-400"; }

  const fmt = meta.fmt ?? ((n) => String(n));
  const limLabel = info.limite === -1 ? "Ilimitado"
    : info.recurso === "storage"
      ? `${Math.round(info.limite / 1024 / 1024)} MB`
      : String(info.limite);

  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{meta.label}</span>
        {!ilimitado && pct >= 80 && <AlertTriangle className="ml-auto h-3.5 w-3.5 text-amber-500" />}
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold tabular-nums ${pct >= 80 && !ilimitado ? textColor : ""}`}>
          {fmt(info.usado)}
        </span>
        <span className="text-xs text-muted-foreground">
          {ilimitado ? <span className="text-emerald-600 font-medium">Ilimitado</span> : `/ ${limLabel}`}
        </span>
      </div>
      {!ilimitado && (
        <>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground tabular-nums">{pct}% utilizado</p>
        </>
      )}
    </div>
  );
}

export default async function PlanoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireSession();
  const tenantBase = await requireTenantPorSlug(slug);

  const [tenant, planos, uso] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantBase.id },
      select: { planoId: true, upgradeSolicitadoEm: true, descontoPercent: true },
    }),
    prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { precoMensalCentavos: "asc" },
    }),
    getUsoCompleto(tenantBase.id),
  ]);

  const planoAtual = planos.find((p) => p.id === tenant?.planoId);
  const jaSolicitado = !!tenant?.upgradeSolicitadoEm;
  const desconto = tenant?.descontoPercent ?? 0;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano da loja</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe o consumo do seu plano e solicite upgrade quando precisar de mais capacidade.
        </p>
      </div>

      {jaSolicitado && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium">Pedido de upgrade enviado</p>
          <p className="text-muted-foreground mt-0.5">
            Recebemos seu pedido em {formatDate(tenant!.upgradeSolicitadoEm!)}. Nossa equipe vai entrar em
            contato para combinar o pagamento e ativar o novo plano.
          </p>
        </div>
      )}

      {/* Current plan summary */}
      {planoAtual && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge>Plano atual</Badge>
                <span className="font-bold">{planoAtual.nome}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {planoAtual.precoMensalCentavos === 0 ? "Grátis" : formatCentavos(
                    desconto > 0
                      ? Math.round(planoAtual.precoMensalCentavos * (1 - desconto / 100))
                      : planoAtual.precoMensalCentavos
                  )}
                </span>
                {planoAtual.precoMensalCentavos > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
                {desconto > 0 && (
                  <span className="ml-2 text-xs line-through text-muted-foreground">
                    {formatCentavos(planoAtual.precoMensalCentavos)}
                  </span>
                )}
              </div>
            </div>
            {desconto > 0 && (
              <Badge variant="success">{desconto}% de desconto aplicado</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage bars */}
      <div>
        <h2 className="text-base font-semibold mb-3">Uso atual do mês</h2>
        {uso.alertas.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Você está acima de 80% em: <strong>{uso.alertas.map(a => RECURSO_META[a].label).join(", ")}</strong>.
            Considere fazer upgrade para evitar bloqueios.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <UsageBar info={uso.veiculos} />
          <UsageBar info={uso.usuarios} />
          <UsageBar info={uso.placas} />
          <UsageBar info={uso.cnpjs} />
          <UsageBar info={uso.storage} />
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-base font-semibold mb-4">Planos disponíveis</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {planos
            .filter(p => p.slug !== "pro") // hide legacy
            .map((p) => {
              const isAtual = p.id === planoAtual?.id;
              const features = (p.limiteIntegracoesJson ?? {}) as Record<string, boolean>;
              const extras   = (p.featuresJson ?? {}) as Record<string, boolean>;
              return (
                <Card key={p.id} className={isAtual ? "border-primary ring-1 ring-primary/40" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.nome}</CardTitle>
                      {isAtual && <Badge>Plano atual</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {p.precoMensalCentavos === 0 ? "Grátis" : formatCentavos(p.precoMensalCentavos)}
                      </span>
                      {p.precoMensalCentavos > 0 && <span className="text-xs text-muted-foreground">/mês</span>}
                    </div>
                    {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1.5 text-sm">
                      <Feature label={p.limiteVeiculos === -1 ? "Veículos ilimitados" : `${p.limiteVeiculos} veículos`} />
                      <Feature label={p.limiteUsuarios === -1 ? "Usuários ilimitados" : `${p.limiteUsuarios} usuário(s)`} />
                      <Feature label={p.limitePlacasMes === -1 ? "Placas ilimitadas/mês" : `${p.limitePlacasMes} placas/mês`} />
                      <Feature label={p.limiteStorageMB === -1 ? "Storage ilimitado" : `${Math.round(p.limiteStorageMB / 1024)} GB storage`} />
                      <Feature label="Assinatura eletrônica" enabled={!!features.assinatura} />
                      <Feature label="WhatsApp integrado" enabled={!!features.whatsapp} />
                      <Feature label="Módulo de leilão" enabled={!!extras.leilao} />
                    </ul>
                    {!isAtual && <UpgradeButton slug={slug} disabled={jaSolicitado} />}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Pagamentos ainda são processados manualmente. Ao solicitar upgrade, nossa equipe combina
        a forma de pagamento e ativa o novo plano. Dúvidas?{" "}
        <Link href={`/t/${slug}/configuracoes`} className="underline underline-offset-2">
          Voltar para configurações
        </Link>.
      </p>
    </div>
  );
}

function Feature({ label, enabled = true }: { label: string; enabled?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${enabled ? "" : "text-muted-foreground/50"}`}>
      <Check className={`h-4 w-4 shrink-0 ${enabled ? "text-primary" : "text-muted-foreground/30"}`} />
      {label}
    </li>
  );
}
