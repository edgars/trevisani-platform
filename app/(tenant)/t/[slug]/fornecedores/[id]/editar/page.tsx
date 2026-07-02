import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { FornecedorForm } from "../../novo/fornecedor-form";

export const metadata = { title: "Editar Fornecedor" };

export default async function EditarFornecedorPage({
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

  const fornecedor = await prisma.fornecedor.findFirst({
    where: { id, tenantId },
  });

  if (!fornecedor) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/t/${slug}/fornecedores`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Editar fornecedor</h1>
          <p className="text-sm text-muted-foreground">{fornecedor.nome}</p>
        </div>
      </div>

      <FornecedorForm
        slug={slug}
        fornecedor={{
          id:          fornecedor.id,
          tipoPessoa:  fornecedor.tipoPessoa as "PF" | "PJ",
          nome:        fornecedor.nome,
          razaoSocial: fornecedor.razaoSocial,
          documento:   fornecedor.documento,
          email:       fornecedor.email,
          telefone:    fornecedor.telefone,
          cep:         fornecedor.cep,
          logradouro:  fornecedor.logradouro,
          numero:      fornecedor.numero,
          complemento: fornecedor.complemento,
          bairro:      fornecedor.bairro,
          cidade:      fornecedor.cidade,
          estado:      fornecedor.estado,
          observacoes: fornecedor.observacoes,
        }}
      />
    </div>
  );
}
