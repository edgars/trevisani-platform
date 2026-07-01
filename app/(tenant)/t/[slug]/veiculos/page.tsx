import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Estoque" };

export default async function EstoquePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await requireTenantPorSlug(slug);
  const veiculos = await prisma.veiculo.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque de veículos</h1>
          <p className="text-sm text-muted-foreground">
            {veiculos.length} veículo(s) listados.
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/veiculos/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar veículo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Veículos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {veiculos.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum veículo cadastrado. O CRUD completo será implementado na Fase 1.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Placa</th>
                    <th className="px-6 py-3 text-left">Marca / Modelo</th>
                    <th className="px-6 py-3 text-left">Ano</th>
                    <th className="px-6 py-3 text-left">KM</th>
                    <th className="px-6 py-3 text-right">Custo</th>
                    <th className="px-6 py-3 text-right">Venda</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {veiculos.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="px-6 py-3 font-mono text-xs">{v.placa ?? "—"}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium">
                          {v.marca} {v.modelo}
                        </div>
                        {v.versao && (
                          <div className="text-xs text-muted-foreground">{v.versao}</div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {v.anoFabricacao}/{v.anoModelo}
                      </td>
                      <td className="px-6 py-3">
                        {v.kmAtual ? `${v.kmAtual.toLocaleString("pt-BR")} km` : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatCentavos(v.precoCustoCentavos)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {formatCentavos(v.precoVendaCentavos)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={v.status === "DISPONIVEL" ? "success" : "secondary"}>
                          {v.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
