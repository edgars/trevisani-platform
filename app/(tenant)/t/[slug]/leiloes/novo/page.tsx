import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { LeilaoForm } from "../leilao-form";
import { criarLeilaoAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo leilão" };

export default async function NovoLeilaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant] = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.leilaoHabilitado) notFound();

  const veiculos = await prisma.veiculo.findMany({
    where: { tenantId: tenant.id, status: { in: ["DISPONIVEL", "EM_PREPARACAO"] } },
    select: { id: true, marca: true, modelo: true, anoModelo: true, placa: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo leilão</h1>
        <p className="text-sm text-muted-foreground">Configure as informações e o prazo do leilão.</p>
      </div>
      <LeilaoForm slug={slug} veiculos={veiculos} action={criarLeilaoAction} />
    </div>
  );
}
