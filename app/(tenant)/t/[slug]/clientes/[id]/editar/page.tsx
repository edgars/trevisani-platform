import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { ClienteForm } from "../../novo/cliente-form";

export const metadata = { title: "Editar Cliente" };

export default async function EditarClientePage({
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
    include: { _count: { select: { documentos: true } } },
  });

  if (!cliente) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Link href={`/t/${slug}/clientes`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">Editar dados do cliente</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/t/${slug}/clientes/${id}/documentos`}>
            <FileText className="mr-2 h-4 w-4" />
            Documentos ({cliente._count.documentos})
          </Link>
        </Button>
      </div>

      <ClienteForm
        slug={slug}
        cliente={{
          id:              cliente.id,
          tipoPessoa:      cliente.tipoPessoa,
          nome:            cliente.nome,
          documento:       cliente.documento,
          email:           cliente.email,
          telefone:        cliente.telefone,
          aniversarioDia:  cliente.aniversarioDia,
          aniversarioMes:  cliente.aniversarioMes,
          tags:            cliente.tags,
          cep:             cliente.cep,
          logradouro:      cliente.logradouro,
          numero:          cliente.numero,
          complemento:     cliente.complemento,
          bairro:          cliente.bairro,
          cidade:          cliente.cidade,
          uf:              cliente.uf,
          observacoes:     cliente.observacoes,
          consenteLgpd:    cliente.consenteLgpd,
        }}
      />
    </div>
  );
}
