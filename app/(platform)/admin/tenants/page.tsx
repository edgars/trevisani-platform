import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Tenants" };

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plano: true,
      _count: { select: { usuarios: true, veiculos: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Cada tenant é uma revenda isolada com seus próprios usuários e dados.
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Novo tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os tenants ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">Loja</th>
                  <th className="px-6 py-3 text-left">Slug</th>
                  <th className="px-6 py-3 text-left">Plano</th>
                  <th className="px-6 py-3 text-left">Usuários</th>
                  <th className="px-6 py-3 text-left">Veículos</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Criado em</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum tenant cadastrado. Rode <code>npm run db:seed</code>.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-6 py-3 font-medium">{t.nome}</td>
                      <td className="px-6 py-3 font-mono text-xs">{t.slug}</td>
                      <td className="px-6 py-3">{t.plano?.nome ?? "—"}</td>
                      <td className="px-6 py-3">{t._count.usuarios}</td>
                      <td className="px-6 py-3">{t._count.veiculos}</td>
                      <td className="px-6 py-3">
                        <Badge variant={t.status === "ATIVO" ? "success" : "secondary"}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/t/${t.slug}`} target="_blank">
                            Abrir <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
