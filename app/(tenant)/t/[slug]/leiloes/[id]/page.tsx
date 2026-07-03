import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { formatCentavos } from "@/lib/utils";
import { LeilaoLive } from "./leilao-live";
import { cancelarLeilaoAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE = {
  AGENDADO:  "secondary" as const,
  ATIVO:     "success" as const,
  ENCERRADO: "secondary" as const,
  CANCELADO: "destructive" as const,
};
const STATUS_LABEL = {
  AGENDADO: "Agendado", ATIVO: "Em andamento", ENCERRADO: "Encerrado", CANCELADO: "Cancelado",
};

export default async function LeilaoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [tenant, session] = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.leilaoHabilitado) notFound();

  const [leilao, clientes] = await Promise.all([
    prisma.leilao.findUnique({
      where: { id },
      include: {
        veiculo: { select: { id: true, marca: true, modelo: true, anoModelo: true, placa: true } },
        lances: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { cliente: { select: { nome: true } } },
        },
      },
    }),
    prisma.clienteFinal.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
      take: 200,
    }),
  ]);

  if (!leilao || leilao.tenantId !== tenant.id) notFound();

  const podeEditar = leilao.status === "AGENDADO" || leilao.status === "ATIVO";
  const podeCancelar = podeEditar && leilao.lances.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{leilao.titulo}</h1>
            <Badge variant={STATUS_BADGE[leilao.status]}>{STATUS_LABEL[leilao.status]}</Badge>
          </div>
          {leilao.veiculo && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {leilao.veiculo.marca} {leilao.veiculo.modelo} {leilao.veiculo.anoModelo}
              {leilao.veiculo.placa && ` · ${leilao.veiculo.placa}`}
            </p>
          )}
          {leilao.descricao && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{leilao.descricao}</p>
          )}
        </div>
        <div className="flex gap-2">
          {podeEditar && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${slug}/leiloes/${id}/editar`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
              </Link>
            </Button>
          )}
          {podeCancelar && (
            <form action={async () => { "use server"; await cancelarLeilaoAction(id); }}>
              <Button variant="destructive" size="sm" type="submit">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancelar
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Início: <strong className="text-foreground">
          {leilao.dataInicio.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </strong></span>
        <span>·</span>
        <span>Encerramento: <strong className="text-foreground">
          {leilao.dataFim.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </strong></span>
        <span>·</span>
        <span>Incremento mínimo: <strong className="text-foreground">{formatCentavos(leilao.incrementoMin)}</strong></span>
        <span>·</span>
        <span>Lance inicial: <strong className="text-foreground">{formatCentavos(leilao.precoInicial)}</strong></span>
      </div>

      {/* Live component */}
      <LeilaoLive
        leilaoId={id}
        slug={slug}
        initialStatus={leilao.status}
        initialPrecoAtual={leilao.precoAtual}
        initialLances={leilao.lances.map(l => ({
          id: l.id,
          valorCentavos: l.valorCentavos,
          createdAt: l.createdAt,
          cliente: { nome: l.cliente.nome },
        }))}
        dataFim={leilao.dataFim}
        incrementoMin={leilao.incrementoMin}
        clientes={clientes}
      />
    </div>
  );
}
