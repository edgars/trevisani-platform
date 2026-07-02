import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { formatCentavos, formatDate } from "@/lib/utils";
import { CompraAcoes } from "../compra-acoes";
import { PagamentoForm } from "./pagamento-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { id } = await params;
  const compra = await prisma.compra.findUnique({ where: { id }, select: { numero: true } });
  return { title: compra ? `Compra #${String(compra.numero).padStart(4, "0")}` : "Compra" };
}

const STATUS_CONFIG = {
  RASCUNHO:              { label: "Rascunho",               variant: "secondary"   as const },
  AGUARDANDO_ASSINATURA: { label: "Ag. assinatura",          variant: "warning"     as const },
  CONCLUIDA:             { label: "Concluída",               variant: "success"     as const },
  CANCELADA:             { label: "Cancelada",               variant: "destructive" as const },
};

const FORMA_LABEL: Record<string, string> = {
  PIX: "PIX", TRANSFERENCIA: "Transferência", BOLETO: "Boleto",
  DINHEIRO: "Dinheiro", CARTAO: "Cartão", FINANCIAMENTO: "Financiamento", OUTRO: "Outro",
};

export default async function CompraDetalhePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const compra = await prisma.compra.findFirst({
    where: { id, tenantId },
    include: {
      fornecedor: { select: { id: true, nome: true, razaoSocial: true, documento: true } },
      itens: {
        include: {
          veiculo: {
            select: {
              id: true, marca: true, modelo: true, versao: true,
              placa: true, anoFabricacao: true, anoModelo: true,
              precoCustoCentavos: true, status: true,
              fotos: { where: { destaque: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
      pagamentos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!compra) notFound();

  const cfg = STATUS_CONFIG[compra.status];
  const totalPago = compra.pagamentos.reduce((s, p) => s + p.valorCentavos, 0);
  const saldo = compra.valorTotalCentavos - totalPago;
  const podeEditar = !["CONCLUIDA","CANCELADA"].includes(compra.status);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/t/${slug}/compras`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Compra #{String(compra.numero).padStart(4, "0")}
              </h1>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(compra.dataOperacao)} ·{" "}
              <Link
                href={`/t/${slug}/fornecedores/${compra.fornecedor.id}/editar`}
                className="hover:underline"
              >
                {compra.fornecedor.nome}
              </Link>
            </p>
          </div>
        </div>
        <CompraAcoes slug={slug} compraId={compra.id} status={compra.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Coluna principal */}
        <div className="space-y-6">
          {/* Veículos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Veículos adquiridos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {compra.itens.map((item) => {
                  const foto = item.veiculo.fotos[0]?.url;
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {foto ? (
                          <Image src={foto} alt={`${item.veiculo.marca} ${item.veiculo.modelo}`} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Car className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/t/${slug}/veiculos/${item.veiculo.id}/editar`}
                          className="font-medium hover:underline"
                        >
                          {item.veiculo.marca} {item.veiculo.modelo}
                          {item.veiculo.versao ? ` ${item.veiculo.versao}` : ""}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.veiculo.anoFabricacao}/{item.veiculo.anoModelo}
                          {item.veiculo.placa ? ` · ${item.veiculo.placa}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCentavos(item.valorCentavos)}</p>
                        {item.observacoes && (
                          <p className="text-xs text-muted-foreground">{item.observacoes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end border-t px-5 py-3">
                <span className="text-sm text-muted-foreground mr-3">Total da compra</span>
                <span className="text-lg font-bold">{formatCentavos(compra.valorTotalCentavos)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {compra.observacoes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{compra.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna de pagamentos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pagamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumo financeiro */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor total</span>
                  <span className="font-medium">{formatCentavos(compra.valorTotalCentavos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="font-medium text-emerald-600">{formatCentavos(totalPago)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Saldo a pagar</span>
                  <span className={saldo > 0 ? "text-destructive" : "text-emerald-600"}>
                    {saldo > 0 ? `- ${formatCentavos(saldo)}` : "Quitado"}
                  </span>
                </div>
              </div>

              {/* Lista de pagamentos */}
              {compra.pagamentos.length > 0 ? (
                <div className="divide-y rounded-xl border">
                  {compra.pagamentos.map((p) => (
                    <div key={p.id} className="flex items-start justify-between px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{p.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {FORMA_LABEL[p.formaPagamento] ?? p.formaPagamento} · {formatDate(p.createdAt)}
                        </p>
                      </div>
                      <span className="font-medium">{formatCentavos(p.valorCentavos)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum pagamento lançado.</p>
              )}

              {/* Formulário novo pagamento */}
              {podeEditar && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-3 text-sm font-medium">Lançar pagamento</p>
                    <PagamentoForm slug={slug} compraId={compra.id} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
