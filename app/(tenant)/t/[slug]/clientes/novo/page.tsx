import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { consultarCnpj } from "@/lib/integrations/cnpj";
import { ClienteForm } from "./cliente-form";
import type { CnpjDados } from "@/lib/integrations/cnpj";

export const metadata = { title: "Novo Cliente" };

export default async function NovoClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cpf?: string; cnpj?: string; dados?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);

  // Pré-preenchimento por CPF
  const prefilledCpf = sp.cpf ?? undefined;

  // Pré-preenchimento por CNPJ — tenta usar dados já codificados na URL
  // ou busca da API/cache no servidor
  let prefilledCnpj: string | undefined;
  let prefilledCnpjDados: CnpjDados | undefined;

  if (sp.cnpj) {
    prefilledCnpj = sp.cnpj;
    if (sp.dados) {
      try {
        prefilledCnpjDados = JSON.parse(decodeURIComponent(sp.dados)) as CnpjDados;
      } catch {
        // fallback para busca
      }
    }
    if (!prefilledCnpjDados) {
      const dados = await consultarCnpj(sp.cnpj);
      prefilledCnpjDados = dados ?? undefined;
    }
  }

  const isPJ = !!prefilledCnpj;
  const titulo = isPJ
    ? prefilledCnpjDados
      ? `Nova empresa — ${prefilledCnpjDados.razaoSocial}`
      : "Nova empresa (PJ)"
    : "Novo cliente";

  const subtitulo = isPJ
    ? "Dados preenchidos automaticamente pela Receita Federal. Confirme antes de salvar."
    : prefilledCpf
    ? "CPF pré-carregado. Preencha os demais dados do cliente."
    : "Preencha os dados do cliente para cadastrá-lo.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Link href={`/t/${slug}/clientes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{subtitulo}</p>
        </div>
      </div>

      <ClienteForm
        slug={slug}
        prefilledCpf={prefilledCpf}
        prefilledCnpj={prefilledCnpj}
        prefilledCnpjDados={prefilledCnpjDados}
      />
    </div>
  );
}
