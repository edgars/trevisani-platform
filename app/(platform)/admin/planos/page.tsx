import Link from "next/link";
import { Edit2, Plus, Users, Car, HardDrive, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Planos" };

function limitLabel(v: number, suffix = "") {
  return v === -1 ? "∞" : `${v.toLocaleString("pt-BR")}${suffix}`;
}

export default async function AdminPlanosPage() {
  const planos = await prisma.plano.findMany({
    orderBy: { precoMensalCentavos: "asc" },
    include: { _count: { select: { tenants: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-sm text-muted-foreground">
            Capacidades e limites de cada tier da plataforma.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/planos/novo"><Plus className="mr-2 h-4 w-4" />Novo plano</Link>
        </Button>
      </div>

      {planos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum plano cadastrado. Crie o primeiro plano.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planos.map((p) => (
            <Card key={p.id} className={!p.ativo ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{p.nome}</CardTitle>
                    <code className="text-xs text-muted-foreground">{p.slug}</code>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={p.ativo ? "secondary" : "outline"} className={p.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{p._count.tenants} tenant(s)</span>
                  </div>
                </div>
                {p.descricao && <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preços */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Mensal</p>
                    <p className="font-semibold">{formatCentavos(p.precoMensalCentavos)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Anual</p>
                    <p className="font-semibold">{formatCentavos(p.precoAnualCentavos)}</p>
                  </div>
                </div>

                {/* Limites */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { icon: Users, label: "Usuários",    value: limitLabel(p.limiteUsuarios) },
                    { icon: Car,   label: "Veículos",    value: limitLabel(p.limiteVeiculos) },
                    { icon: HardDrive, label: "Storage", value: limitLabel(p.limiteStorageMB, " MB") },
                    { icon: Activity, label: "Placas/mês", value: limitLabel(p.limitePlacasMes) },
                    { icon: Activity, label: "CNPJs/mês",  value: limitLabel(p.limiteCnpjsMes) },
                    { icon: Users, label: "Clientes/mês", value: limitLabel(p.limiteClientesMes) },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1.5">
                      <item.icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="ml-auto font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/admin/planos/${p.id}/editar`}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" />Editar plano
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
