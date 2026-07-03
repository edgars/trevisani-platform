import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { CategoriasManager } from "./categorias-manager";

export const metadata = { title: "Categorias Financeiras" };

export default async function CategoriasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const categorias = await prisma.categoriaFinanceira.findMany({
    where: { tenantId },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    include: {
      itens: { where: { ativo: true }, orderBy: { nome: "asc" } },
      _count: { select: { movimentacoes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorias Financeiras</h1>
        <p className="text-sm text-muted-foreground">
          Organize suas receitas e despesas com categorias e subcategorias.
        </p>
      </div>
      <CategoriasManager slug={slug} categorias={categorias.map(c => ({
        id: c.id,
        nome: c.nome,
        tipo: c.tipo as "ENTRADA" | "SAIDA",
        cor: c.cor,
        icone: c.icone,
        ativo: c.ativo,
        movimentacoes: c._count.movimentacoes,
        itens: c.itens.map(i => ({ id: i.id, nome: i.nome, ativo: i.ativo })),
      }))} />
    </div>
  );
}
