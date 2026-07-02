import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { ArquivosManager } from "./arquivos-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug } = await params;
  return { title: `Documentos — ${slug}` };
}

export default async function ArquivosVeiculoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: veiculoId } = await params;

  const session = await requireSession();
  const tenantId =
    session.user.escopo === "PLATAFORMA"
      ? (await requireTenantPorSlug(slug)).id
      : session.user.tenantId!;

  const veiculo = await prisma.veiculo.findFirst({
    where: { id: veiculoId, tenantId },
    select: {
      id: true,
      marca: true,
      modelo: true,
      versao: true,
      anoFabricacao: true,
      anoModelo: true,
      documentos: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nome: true,
          url: true,
          mimeType: true,
          tamanhoBytes: true,
          tipo: true,
          anotacao: true,
          tags: true,
          createdAt: true,
        },
      },
    },
  });

  if (!veiculo) notFound();

  // Todas as tags já usadas pelo tenant (para reutilização)
  const todosDocumentos = await prisma.documentoVeiculo.findMany({
    where: { veiculo: { tenantId } },
    select: { tags: true },
  });
  const tagsDoTenant = Array.from(
    new Set(todosDocumentos.flatMap((d) => d.tags)),
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/t/${slug}/veiculos`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-bold tracking-tight">Documentos</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {veiculo.marca} {veiculo.modelo}
              {veiculo.versao ? ` · ${veiculo.versao}` : ""} ·{" "}
              {veiculo.anoFabricacao}/{veiculo.anoModelo}
            </p>
          </div>
        </div>

        {/* Atalho para fotos */}
        <Button asChild variant="outline" size="sm">
          <Link href={`/t/${slug}/veiculos/${veiculoId}/fotos`}>Ver fotos</Link>
        </Button>
      </div>

      <ArquivosManager
        slug={slug}
        veiculoId={veiculo.id}
        tagsExistentes={tagsDoTenant}
        documentosIniciais={veiculo.documentos.map((d) => ({
          ...d,
          anotacao: d.anotacao ?? null,
          tags: d.tags ?? [],
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
