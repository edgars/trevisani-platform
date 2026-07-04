import Link from "next/link";
import {
  ArrowRight,
  Car,
  Check,
  CheckCircle2,
  DollarSign,
  Globe,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/portal/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { cn, formatCentavos } from "@/lib/utils";
import { getUsoCompleto } from "@/lib/plano/limites";
import { PlanoUsageWidget } from "@/components/portal/plano-usage-widget";

export const metadata = { title: "Dashboard" };

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);

  const [
    totalVeiculos,
    veiculosDisponiveis,
    veiculosVendidos,
    comprasAbertas,
    vendasAbertas,
    somaEstoque,
    websiteConfig,
  ] =
    await prisma.$transaction([
      prisma.veiculo.count({ where: { tenantId: tenant.id } }),
      prisma.veiculo.count({ where: { tenantId: tenant.id, status: "DISPONIVEL" } }),
      prisma.veiculo.count({ where: { tenantId: tenant.id, status: "VENDIDO" } }),
      prisma.compra.count({
        where: { tenantId: tenant.id, status: { in: ["RASCUNHO", "AGUARDANDO_ASSINATURA"] } },
      }),
      prisma.venda.count({
        where: { tenantId: tenant.id, status: { in: ["RASCUNHO", "PROPOSTA_ENVIADA", "RESERVADA", "AGUARDANDO_ASSINATURA"] } },
      }),
      prisma.veiculo.aggregate({
        where: { tenantId: tenant.id, status: { in: ["DISPONIVEL", "EM_PREPARACAO", "RESERVADO"] } },
        _sum: { precoCustoCentavos: true },
      }),
      prisma.websiteConfig.findUnique({
        where: { tenantId: tenant.id },
        select: { publicado: true },
      }),
    ]);

  const uso = await getUsoCompleto(tenant.id);
  const config = (tenant.configJson as Record<string, string> | null) ?? {};
  const slugPersonalizado = !config.slugInicial || config.slugInicial !== tenant.slug;

  const etapas = [
    {
      titulo: "Cadastre seu primeiro veículo",
      descricao: "Adicione um veículo ao estoque para começar a vender.",
      feita: totalVeiculos > 0,
      href: `/t/${slug}/veiculos/novo`,
      cta: "Cadastrar veículo",
    },
    {
      titulo: "Personalize o endereço da sua loja",
      descricao: "Escolha o endereço (slug) que vai identificar sua vitrine online.",
      feita: slugPersonalizado,
      href: `/t/${slug}/configuracoes`,
      cta: "Configurar endereço",
    },
    {
      titulo: "Publique o site da sua loja",
      descricao: "Personalize o tema e publique a vitrine para seus clientes.",
      feita: !!websiteConfig?.publicado,
      href: `/t/${slug}/website`,
      cta: "Configurar site",
    },
  ];

  const onboardingConcluido = etapas.every((e) => e.feita);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo, {tenant.nome}.</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada da sua operação.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Veículos disponíveis" value={veiculosDisponiveis} icon={Car} />
        <StatCard label="Veículos vendidos" value={veiculosVendidos} icon={Truck} />
        <StatCard
          label="Capital em estoque"
          value={formatCentavos(somaEstoque._sum.precoCustoCentavos ?? 0)}
          icon={DollarSign}
        />
      </div>

      {/* Plan usage widget */}
      <PlanoUsageWidget uso={uso} slug={slug} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" /> Compras em andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{comprasAbertas}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Rascunhos ou aguardando assinatura do fornecedor.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" /> Vendas em andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vendasAbertas}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Propostas, reservas e contratos aguardando assinatura.
            </p>
          </CardContent>
        </Card>
      </div>

      {onboardingConcluido ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm">
              Sua loja está configurada e pronta para vender. Continue cadastrando veículos e
              acompanhando seus indicadores por aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Primeiros passos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conclua estas etapas para deixar sua loja pronta para vender online.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {etapas.map((etapa) => (
              <div
                key={etapa.titulo}
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-4",
                  etapa.feita && "border-emerald-500/30 bg-emerald-500/5",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    etapa.feita ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {etapa.feita ? <Check className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", etapa.feita && "text-emerald-800 dark:text-emerald-300")}>
                    {etapa.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
                </div>
                {!etapa.feita && (
                  <Link
                    href={etapa.href}
                    className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {etapa.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
