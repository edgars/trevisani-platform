import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatarNumero, jidParaNumero, listarChats } from "@/lib/integrations/whatsapp/evolution";
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
    select: { id: true, numeroConectado: true },
  });
  if (!integracao) notFound();

  const conversas = await prisma.conversaWpp.findMany({
    where: {
      integracaoId: integracao.id,
      remoteJid: { not: "status@broadcast" },
      NOT: [
        { remoteJid: { startsWith: "0@" } },
        { remoteJid: { endsWith: "@g.us" } },
      ],
    },
    orderBy: { ultimaMensagem: "desc" },
    take: 100,
    include: {
      cliente: { select: { nome: true } },
      mensagens: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { corpo: true, fromMe: true, tipo: true },
      },
    },
  });
  const chats = await listarChats(`loja-${tenant.id}`, 150).catch(() => []);
  const avatarByJid = new Map<string, string>();
  for (const c of chats) {
    if (c.remoteJid && c.profilePicUrl) avatarByJid.set(c.remoteJid, c.profilePicUrl);
  }

  const conversa = await prisma.conversaWpp.findFirst({
    where:   { id: conversaId, integracaoId: integracao.id },
    include: {
      cliente: { select: { id: true, nome: true } },
      mensagens: {
        orderBy: { timestamp: "desc" },
        take: 250,
        select: { id: true, fromMe: true, corpo: true, tipo: true, timestamp: true, lida: true },
      },
    },
  });
  if (!conversa) notFound();

  const nome = conversa.cliente?.nome ?? conversa.nomeContato ?? formatarNumero(jidParaNumero(conversa.remoteJid));
  const numero = formatarNumero(jidParaNumero(conversa.remoteJid));

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-[#f7f8fa] lg:block">
          <div className="border-b bg-[#f0f2f5] p-3">
            <div className="mb-2 flex items-center justify-between">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/t/${slug}/whatsapp`}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">{formatarNumero(integracao.numeroConectado ?? "")}</span>
            </div>
            <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Search className="mr-2 inline h-4 w-4" />
              Buscar ou iniciar conversa
            </div>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto divide-y">
            {conversas.map((c) => {
              const ultimaMsg = c.mensagens[0];
              const nomeContato =
                c.cliente?.nome ?? c.nomeContato ?? formatarNumero(jidParaNumero(c.remoteJid));
              const avatarUrl = avatarByJid.get(c.remoteJid);
              const ativo = c.id === conversaId;
              return (
                <Link
                  key={c.id}
                  href={`/t/${slug}/whatsapp/${c.id}`}
                  className={`flex items-center gap-3 px-3 py-3 transition-colors ${
                    ativo ? "bg-[#e9edef]" : "hover:bg-[#ebedf0]"
                  }`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nomeContato}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
                      {nomeContato.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${c.totalNaoLidas > 0 ? "font-semibold" : "font-medium"}`}>
                        {nomeContato}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${c.totalNaoLidas > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {ultimaMsg?.fromMe ? "Você: " : ""}
                        {ultimaMsg ? (ultimaMsg.tipo !== "text" ? `[${ultimaMsg.tipo}]` : ultimaMsg.corpo) : "Sem mensagens"}
                      </p>
                      {c.totalNaoLidas > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                          {c.totalNaoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <WppChat
            slug={slug}
            conversaId={conversaId}
            nome={nome}
            numero={numero}
            avatarUrl={avatarByJid.get(conversa.remoteJid)}
            clienteId={conversa.cliente?.id}
            initialMensagens={conversa.mensagens.map(m => ({
              ...m,
              timestamp: m.timestamp,
            })).reverse()}
          />
        </section>
      </div>
    </div>
  );
}
