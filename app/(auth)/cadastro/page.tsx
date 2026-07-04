import { Suspense } from "react";

import { prisma } from "@/lib/db/client";
import { CadastroForm } from "./cadastro-form";

export const metadata = { title: "Criar conta — Volante7" };
export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const planos = await prisma.plano.findMany({
    where: { ativo: true },
    orderBy: { precoMensalCentavos: "asc" },
    select: { slug: true, nome: true, precoMensalCentavos: true, limiteVeiculos: true },
  });

  return (
    <Suspense>
      <CadastroForm planos={planos} />
    </Suspense>
  );
}
