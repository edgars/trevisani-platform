import {
  Car,
  DollarSign,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/portal/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);

  const [veiculosDisponiveis, veiculosVendidos, comprasAbertas, vendasAbertas, somaEstoque] =
    await prisma.$transaction([
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
    ]);

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

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A Fase 0 está pronta: você pode navegar por todos os módulos deste tenant.
            As telas de negócio (estoque, compras, vendas, financeiro,
            documentos) serão implementadas na <strong>Fase 1</strong> do roadmap.
          </p>
          <p>
            Para começar, configure as integrações em{" "}
            <span className="font-medium">Configurações → Integrações</span> e convide sua
            equipe em <span className="font-medium">Configurações → Usuários</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
