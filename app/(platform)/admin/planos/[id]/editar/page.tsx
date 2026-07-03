import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { PlanoForm } from "../../plano-form";
import { ExcluirPlanoButton } from "./excluir-button";

export const metadata = { title: "Editar Plano" };

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plano = await prisma.plano.findUnique({
    where: { id },
    include: { _count: { select: { tenants: true } } },
  });
  if (!plano) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/admin/planos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Editar: {plano.nome}</h1>
            <p className="text-sm text-muted-foreground">{plano._count.tenants} tenant(s) neste plano</p>
          </div>
        </div>
        <ExcluirPlanoButton id={plano.id} nome={plano.nome} count={plano._count.tenants} />
      </div>
      <PlanoForm plano={plano} />
    </div>
  );
}
