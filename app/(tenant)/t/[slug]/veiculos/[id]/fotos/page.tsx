import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { notFound } from "next/navigation";
import { FotosManager } from "./fotos-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug } = await params;
  return { title: `Fotos do veículo — ${slug}` };
}

export default async function FotosVeiculoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: veiculoId } = await params;

  const [session] = await Promise.all([requireSession()]);
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
      fotos: {
        orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          url: true,
          legenda: true,
          status: true,
          destaque: true,
          ordem: true,
        },
      },
    },
  });

  if (!veiculo) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/t/${slug}/veiculos`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Images className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-bold tracking-tight">
                Fotos do veículo
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {veiculo.marca} {veiculo.modelo}
              {veiculo.versao ? ` · ${veiculo.versao}` : ""} ·{" "}
              {veiculo.anoFabricacao}/{veiculo.anoModelo}
            </p>
          </div>
        </div>
      </div>

      <FotosManager
        slug={slug}
        veiculoId={veiculo.id}
        fotosIniciais={veiculo.fotos as any}
      />
    </div>
  );
}
