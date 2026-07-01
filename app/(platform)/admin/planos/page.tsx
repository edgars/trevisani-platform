import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Planos" };

export default async function AdminPlanosPage() {
  const planos = await prisma.plano.findMany({
    orderBy: { precoMensalCentavos: "asc" },
    include: { _count: { select: { tenants: true, assinaturas: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
        <p className="text-sm text-muted-foreground">
          Faturamento e limites aplicados aos tenants. Configuração da Fase 4.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {planos.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.nome}</CardTitle>
                <Badge variant={p.ativo ? "success" : "secondary"}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Preço mensal" value={formatCentavos(p.precoMensalCentavos)} />
              <Row label="Preço anual" value={formatCentavos(p.precoAnualCentavos)} />
              <Row label="Limite de usuários" value={p.limiteUsuarios.toString()} />
              <Row label="Limite de veículos" value={p.limiteVeiculos.toString()} />
              <Row label="Tenants no plano" value={p._count.tenants.toString()} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
