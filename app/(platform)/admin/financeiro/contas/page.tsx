import { requireScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { ContasManager } from "./contas-manager";

export const metadata = { title: "Contas Bancárias da Plataforma" };
export const dynamic = "force-dynamic";

export default async function AdminContasPage() {
  await requireScope("PLATAFORMA");

  const contas = await prisma.contaBancariaPlataforma.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { movimentacoes: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Contas Bancárias</h2>
        <p className="text-sm text-muted-foreground">
          Contas e carteiras usadas para registrar as finanças internas da plataforma.
        </p>
      </div>
      <ContasManager contas={contas.map(c => ({
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
