import Link from "next/link";
import { FileText, Pencil, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatarCpf } from "@/lib/utils/cpf";
import { formatarCnpj } from "@/lib/integrations/cnpj";
import { ClienteLookup } from "./cliente-lookup";
import { ClienteAcoes } from "./cliente-acoes";

export const metadata = { title: "Clientes" };

const MESES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function formatarTelDisplay(tel: string | null): string {
  if (!tel) return "—";
  const d = tel.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

export default async function ClientesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, session] = await Promise.all([params, requireSession()]);
  const tenantId = session.user.tenantId!;

  const clientes = await prisma.clienteFinal.findMany({
    where: { tenantId, ativo: true },
    orderBy: { nome: "asc" },
    take: 300,
    include: { _count: { select: { documentos: true, vendas: true } } },
  });

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} cadastrado{clientes.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Smart Lookup ────────────────────────────────────────────── */}
      <ClienteLookup slug={slug} />

      {/* ── Lista ───────────────────────────────────────────────────── */}
      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-4xl">👤</p>
            <div>
              <p className="font-medium">Nenhum cliente cadastrado ainda.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use o campo acima para buscar ou cadastrar um novo cliente.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Cliente</th>
                    <th className="px-5 py-3 text-left">Documento</th>
                    <th className="px-5 py-3 text-left">Celular</th>
                    <th className="px-5 py-3 text-left">Cidade / UF</th>
                    <th className="px-5 py-3 text-left">Tags</th>
                    <th className="px-5 py-3 text-center">Docs</th>
                    <th className="px-5 py-3 text-center">LGPD</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clientes.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <Link href={`/t/${slug}/clientes/${c.id}/editar`} className="group">
                          <p className="font-medium group-hover:underline">{c.nome}</p>
                          {c.email && (
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          )}
                          {c.tipoPessoa === "PF" && c.aniversarioDia && c.aniversarioMes && (
                            <p className="text-xs text-muted-foreground">
                              🎂 {c.aniversarioDia}/{MESES[c.aniversarioMes]}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {c.tipoPessoa}
                          </Badge>
                          <span className="font-mono text-xs">
                            {c.tipoPessoa === "PJ"
                              ? formatarCnpj(c.documento)
                              : formatarCpf(c.documento)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatarTelDisplay(c.telefone)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ""}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] font-normal"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {c.tags.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{c.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          href={`/t/${slug}/clientes/${c.id}/documentos`}
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {c._count.documentos}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {c.consenteLgpd ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">
                            <UserCheck className="mr-1 h-3 w-3" />OK
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                            <Link href={`/t/${slug}/clientes/${c.id}/editar`} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                            <Link href={`/t/${slug}/clientes/${c.id}/documentos`} title="Documentos">
                              <FileText className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <ClienteAcoes slug={slug} clienteId={c.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
