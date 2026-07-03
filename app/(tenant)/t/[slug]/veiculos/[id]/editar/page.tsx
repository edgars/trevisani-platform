import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { getFornecedoresTenant } from "../../actions";
import { VeiculoForm } from "../../novo/veiculo-form";
import { VeiculoAside } from "./veiculo-aside";

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
      include: {
        fotos: {
          orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
          select: { id: true, url: true, legenda: true, destaque: true },
        },
        documentos: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nome: true,
            mimeType: true,
            tamanhoBytes: true,
            tipo: true,
          },
        },
        checklists: {
          orderBy: { createdAt: "asc" },
          include: {
            itens: {
              orderBy: { categoria: "asc" },
              include: {
                fotos: {
                  orderBy: { createdAt: "asc" },
                  select: { id: true, url: true },
                },
              },
            },
          },
        },
      },
    }),
    getFornecedoresTenant(slug),
  ]);

  if (!veiculo) notFound();

  const tipo =
    veiculo.categoria === "Motocicleta"
      ? "motos"
      : veiculo.categoria === "Caminhão" || veiculo.categoria === "Utilitário"
        ? "caminhoes"
        : "carros";

  // Serialize dates for client components
  const checklists = veiculo.checklists.map((cl) => ({
    id: cl.id,
    titulo: cl.titulo,
    status: cl.status as "PENDENTE" | "CONCLUIDO",
    realizadoEm: cl.realizadoEm?.toISOString() ?? null,
    createdAt: cl.createdAt.toISOString(),
    itens: cl.itens.map((it) => ({
      id: it.id,
      categoria: it.categoria as "LATARIA" | "MOTOR" | "PNEUS" | "ESTOFADO",
      ok: it.ok,
      observacao: it.observacao,
      dataVerificacao: it.dataVerificacao?.toISOString() ?? null,
      fotos: it.fotos,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Link href={`/t/${slug}/veiculos`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Editar veículo</h1>
          <p className="truncate text-sm text-muted-foreground">
            {veiculo.marca} {veiculo.modelo} · {veiculo.anoFabricacao}/{veiculo.anoModelo}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Formulário — ocupa todo o espaço disponível */}
        <div className="min-w-0 flex-1">
          <VeiculoForm
            slug={slug}
            fornecedores={fornecedores}
            veiculo={{
              id:                   veiculo.id,
              status:               veiculo.status,
              tipo:                 tipo as any,
              marca:                veiculo.marca,
              modelo:               veiculo.modelo,
              versao:               veiculo.versao,
              anoFabricacao:        veiculo.anoFabricacao,
              anoModelo:            veiculo.anoModelo,
              cor:                  veiculo.cor,
              categoria:            veiculo.categoria,
              combustivel:          veiculo.combustivel,
              cambio:               veiculo.cambio,
              kmAtual:              veiculo.kmAtual,
              placa:                veiculo.placa,
              renavam:              veiculo.renavam,
              chassi:               veiculo.chassi,
              situacaoDocumental:   veiculo.situacaoDocumental,
              origem:               veiculo.origem,
              fornecedorId:         veiculo.fornecedorId,
              precoCustoCentavos:   veiculo.precoCustoCentavos,
              precoVendaCentavos:   veiculo.precoVendaCentavos,
              observacoes:          veiculo.observacoes,
              // ─ Novos campos técnicos ─
              motor:                veiculo.motor,
              portas:               veiculo.portas,
              ufRegistro:           veiculo.ufRegistro,
              tipoCrv:              veiculo.tipoCrv,
              numeroCrv:            veiculo.numeroCrv,
              chassiRemarcado:      veiculo.chassiRemarcado,
              blindado:             veiculo.blindado,
              leilao:               veiculo.leilao,
              sinistro:             veiculo.sinistro,
              manualProprietario:   veiculo.manualProprietario,
              chaveReserva:         veiculo.chaveReserva,
              proprietarioNome:     veiculo.proprietarioNome,
              proprietarioDoc:      veiculo.proprietarioDoc,
            }}
          />
        </div>

        {/* Painel lateral: imagens, checklists e documentos */}
        <VeiculoAside
          slug={slug}
          veiculoId={veiculo.id}
          fotos={veiculo.fotos}
          documentos={veiculo.documentos}
          checklists={checklists}
        />
      </div>
    </div>
  );
}
