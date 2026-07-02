import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { getFornecedoresTenant } from "../../actions";
import { VeiculoForm } from "../../novo/veiculo-form";

export const metadata = { title: "Editar Veículo" };

export default async function EditarVeiculoPage({
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

  const [veiculo, fornecedores] = await Promise.all([
    prisma.veiculo.findFirst({
      where: { id, tenantId },
    }),
    getFornecedoresTenant(slug),
  ]);

  if (!veiculo) notFound();

  // Detecta tipo a partir da categoria ou deixa "carros" como padrão
  const tipo = veiculo.categoria === "Motocicleta"
    ? "motos"
    : veiculo.categoria === "Caminhão" || veiculo.categoria === "Utilitário"
      ? "caminhoes"
      : "carros";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/t/${slug}/veiculos`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Editar veículo</h1>
          <p className="text-sm text-muted-foreground">
            {veiculo.marca} {veiculo.modelo} · {veiculo.anoFabricacao}/{veiculo.anoModelo}
          </p>
        </div>
      </div>

      <VeiculoForm
        slug={slug}
        fornecedores={fornecedores}
        veiculo={{
          id:                 veiculo.id,
          tipo:               tipo as any,
          marca:              veiculo.marca,
          modelo:             veiculo.modelo,
          versao:             veiculo.versao,
          anoFabricacao:      veiculo.anoFabricacao,
          anoModelo:          veiculo.anoModelo,
          cor:                veiculo.cor,
          categoria:          veiculo.categoria,
          combustivel:        veiculo.combustivel,
          cambio:             veiculo.cambio,
          kmAtual:            veiculo.kmAtual,
          placa:              veiculo.placa,
          renavam:            veiculo.renavam,
          chassi:             veiculo.chassi,
          situacaoDocumental: veiculo.situacaoDocumental,
          origem:             veiculo.origem,
          fornecedorId:       veiculo.fornecedorId,
          precoCustoCentavos: veiculo.precoCustoCentavos,
          precoVendaCentavos: veiculo.precoVendaCentavos,
          observacoes:        veiculo.observacoes,
        }}
      />
    </div>
  );
}
