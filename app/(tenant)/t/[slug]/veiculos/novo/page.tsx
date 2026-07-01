import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { getFornecedoresTenant } from "../actions";
import { VeiculoForm } from "./veiculo-form";

export const metadata = { title: "Cadastrar veículo" };

export default async function NovoVeiculoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireTenantPorSlug(slug);

  const fornecedores = await getFornecedoresTenant(slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/t/${slug}/veiculos`}
          className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar veículo</h1>
          <p className="text-sm text-muted-foreground">
            Selecione marca e modelo para preencher automaticamente.
          </p>
        </div>
      </div>

      <VeiculoForm slug={slug} fornecedores={fornecedores} />
    </div>
  );
}
