import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDadosNovaCompra } from "../actions";
import { CompraForm } from "./compra-form";

export const metadata = { title: "Nova Compra" };

export default async function NovaCompraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { fornecedores, veiculos } = await getDadosNovaCompra(slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={`/t/${slug}/compras`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nova compra</h1>
          <p className="text-sm text-muted-foreground">
            Registre a aquisição de veículos de um fornecedor.
          </p>
        </div>
      </div>

      <CompraForm
        slug={slug}
        fornecedores={fornecedores}
        veiculos={veiculos.map((v) => ({
          ...v,
          thumbUrl: v.fotos[0]?.url ?? null,
        }))}
      />
    </div>
  );
}
