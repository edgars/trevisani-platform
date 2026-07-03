import { Suspense } from "react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { ContasManager } from "./contas-manager";

export const metadata = { title: "Contas Bancárias" };

export default async function ContasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const contas = await prisma.contaBancaria.findMany({
    where: { tenantId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { movimentacoes: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as contas bancárias e carteiras da loja.
        </p>
      </div>
      <ContasManager slug={slug} contas={contas.map(c => ({
        id: c.id,
        nome: c.nome,
        banco: c.banco,
        codigoBanco: c.codigoBanco,
        agencia: c.agencia,
        conta: c.conta,
        tipoConta: c.tipoConta,
        pix: c.pix,
        ativo: c.ativo,
        movimentacoes: c._count.movimentacoes,
      }))} />
    </div>
  );
}
