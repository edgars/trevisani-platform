import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { DocumentosManager } from "./documentos-manager";

export const metadata = { title: "Documentos do Cliente" };

export default async function DocumentosClientePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const session = await requireSession();
  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(slug)).id
      : session.user.tenantId!;

  const cliente = await prisma.clienteFinal.findFirst({
    where: { id, tenantId },
    include: {
      documentos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cliente) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Link href={`/t/${slug}/clientes/${id}/editar`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Documentos — {cliente.nome}
          </h1>
          <p className="text-sm text-muted-foreground">
            Anexos para processos de compra e venda
          </p>
        </div>
      </div>

      <DocumentosManager
        slug={slug}
        clienteId={id}
        documentos={cliente.documentos.map((d) => ({
          id: d.id,
          nome: d.nome,
          url: d.url,
          mimeType: d.mimeType,
          tamanhoBytes: d.tamanhoBytes,
          descricao: d.descricao,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
