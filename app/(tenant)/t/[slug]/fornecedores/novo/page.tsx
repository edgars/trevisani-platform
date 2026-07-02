import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FornecedorForm } from "./fornecedor-form";

export const metadata = { title: "Novo Fornecedor" };

export default async function NovoFornecedorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/t/${slug}/fornecedores`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Novo fornecedor</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados da empresa ou pessoa fornecedora de veículos.
          </p>
        </div>
      </div>

      <FornecedorForm slug={slug} />
    </div>
  );
}
