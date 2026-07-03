import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { LeilaoForm } from "../../leilao-form";
import { atualizarLeilaoAction } from "../../actions";

export const dynamic = "force-dynamic";

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditarLeilaoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [tenant] = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.leilaoHabilitado) notFound();

  const [leilao, veiculos] = await Promise.all([
    prisma.leilao.findUnique({
      where: { id },
      select: {
        id: true, titulo: true, descricao: true, veiculoId: true,
        precoInicial: true, incrementoMin: true, dataInicio: true, dataFim: true,
        status: true, tenantId: true,
      },
    }),
    prisma.veiculo.findMany({
      where: { tenantId: tenant.id, status: { in: ["DISPONIVEL", "EM_PREPARACAO"] } },
      select: { id: true, marca: true, modelo: true, anoModelo: true, placa: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!leilao || leilao.tenantId !== tenant.id) notFound();
  if (leilao.status === "ENCERRADO" || leilao.status === "CANCELADO") notFound();

  const boundAction = atualizarLeilaoAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar leilão</h1>
        <p className="text-sm text-muted-foreground">{leilao.titulo}</p>
      </div>
      <LeilaoForm
        slug={slug}
        veiculos={veiculos}
        action={boundAction}
        submitLabel="Salvar alterações"
        defaults={{
          titulo:        leilao.titulo,
          descricao:     leilao.descricao ?? "",
          veiculoId:     leilao.veiculoId ?? "",
          precoInicial:  leilao.precoInicial / 100,
          incrementoMin: leilao.incrementoMin / 100,
          dataInicio:    toDatetimeLocal(leilao.dataInicio),
          dataFim:       toDatetimeLocal(leilao.dataFim),
        }}
      />
    </div>
  );
}
