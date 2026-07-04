import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

export const metadata = { title: "Planos" };
export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const planos = await prisma.plano.findMany({
    where: { ativo: true },
    orderBy: { precoMensalCentavos: "asc" },
  });

  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Planos que crescem com a sua loja
        </h1>
        <p className="mt-4 text-muted-foreground">
          Comece de graça com até 10 veículos na vitrine e evolua conforme sua operação
          crescer. Sem multa de cancelamento.
        </p>
      </div>

      {planos.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Estamos atualizando nossos planos.{" "}
          <a href="mailto:contato@volante7.com.br" className="underline underline-offset-2">
            Fale com a gente
          </a>{" "}
          para saber mais.
        </div>
      ) : (
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {planos.map((p, i) => {
            const isDestaque = i === planos.length - 2 && planos.length > 1;
            const gratis = p.precoMensalCentavos === 0;
            const limites = (p.limiteIntegracoesJson ?? {}) as Record<string, boolean>;
            return (
              <Card
                key={p.id}
                className={
                  isDestaque
                    ? "border-primary shadow-lg ring-1 ring-primary/40"
                    : undefined
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{p.nome}</CardTitle>
                    {isDestaque && <Badge>Mais popular</Badge>}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {gratis ? "Grátis" : formatCentavos(p.precoMensalCentavos)}
                    </span>
                    {!gratis && <span className="text-sm text-muted-foreground">/mês</span>}
                  </div>
                  {p.descricao && (
                    <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <Feature
                      label={`${p.limiteVeiculos === -1 ? "Veículos ilimitados" : `Até ${p.limiteVeiculos} veículos na vitrine`}`}
                    />
                    <Feature
                      label={`${p.limiteUsuarios === -1 ? "Usuários ilimitados" : `${p.limiteUsuarios} usuários`}`}
                    />
                    <Feature label="Site da loja incluso" />
                    <Feature label="Compras, vendas e financeiro" />
                    <Feature
                      label="Assinatura eletrônica de documentos"
                      enabled={limites.assinatura}
                    />
                    <Feature
                      label="Notificações por WhatsApp"
                      enabled={limites.whatsapp}
                    />
                  </ul>
                  <Button className="w-full" variant={isDestaque ? "default" : "outline"} asChild>
                    <Link href={`/cadastro?plano=${p.slug}`}>
                      {gratis ? "Criar conta grátis" : "Começar agora"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        Ainda não processamos pagamentos automaticamente: ao solicitar upgrade dentro da
        plataforma, nossa equipe entra em contato para combinar o pagamento e ativar o plano.
      </p>
    </div>
  );
}

function Feature({ label, enabled = true }: { label: string; enabled?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${enabled ? "" : "text-muted-foreground/60"}`}>
      <Check className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground/40"}`} />
      {label}
    </li>
  );
}
