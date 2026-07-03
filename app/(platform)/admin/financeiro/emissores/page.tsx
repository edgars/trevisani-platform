import { requireScope } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { EmissoresManager } from "./emissores-manager";

export const metadata = { title: "Fornecedores / Emissores da Plataforma" };
export const dynamic = "force-dynamic";

export default async function AdminEmissoresPage() {
  await requireScope("PLATAFORMA");

  const emissores = await prisma.emissorFinanceiroPlataforma.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { movimentacoes: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Fornecedores / Emissores</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre empresas, funcionários ou sócios para vincular às despesas e receitas da plataforma.
        </p>
      </div>
      <EmissoresManager emissores={emissores.map(e => ({
        id: e.id,
        nome: e.nome,
        tipo: e.tipo,
        documento: e.documento,
        contato: e.contato,
        observacoes: e.observacoes,
        ativo: e.ativo,
        movimentacoes: e._count.movimentacoes,
      }))} />
    </div>
  );
}
