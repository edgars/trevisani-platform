import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatarNumero, jidParaNumero } from "@/lib/integrations/whatsapp/evolution";
import { WppChat } from "./wpp-chat";

export const dynamic = "force-dynamic";

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ slug: string; conversaId: string }>;
}) {
  const { slug, conversaId } = await params;
  const [tenant]  = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.whatsappHabilitado) notFound();

  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where:  { tenantId: tenant.id },
    select: { id: true },
  });
  if (!integracao) notFound();

  const conversa = await prisma.conversaWpp.findFirst({
    where:   { id: conversaId, integracaoId: integracao.id },
    include: {
      cliente: { select: { id: true, nome: true } },
      mensagens: {
        orderBy: { timestamp: "asc" },
        take: 100,
        select: { id: true, fromMe: true, corpo: true, tipo: true, timestamp: true, lida: true },
      },
    },
  });
  if (!conversa) notFound();

  const nome = conversa.cliente?.nome ?? conversa.nomeContato ?? formatarNumero(jidParaNumero(conversa.remoteJid));
  const numero = formatarNumero(jidParaNumero(conversa.remoteJid));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/t/${slug}/whatsapp`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
          {nome.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{nome}</p>
          <p className="text-xs text-muted-foreground">{numero}</p>
        </div>
        {conversa.cliente && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/${slug}/clientes/${conversa.cliente.id}/editar`}>
              <User className="mr-1.5 h-3.5 w-3.5" />
              Ver cliente
              <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
            </Link>
          </Button>
        )}
      </div>

      <WppChat
        slug={slug}
        conversaId={conversaId}
        initialMensagens={conversa.mensagens.map(m => ({
          ...m,
          timestamp: m.timestamp,
        }))}
      />
    </div>
  );
}
