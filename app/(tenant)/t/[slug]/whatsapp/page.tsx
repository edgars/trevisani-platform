import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { MessageCircle, Search, Settings, User, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatarNumero, jidCanonico, jidParaNumero, listarChatsComCache } from "@/lib/integrations/whatsapp/evolution";
import { sincronizarInstancia } from "@/lib/integrations/whatsapp/sync";

export const dynamic = "force-dynamic";
export const metadata = { title: "WhatsApp — Inbox" };

function tempoRelativo(date: Date | null): string {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default async function WppInboxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant]  = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.whatsappHabilitado) notFound();

  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where:   { tenantId: tenant.id },
    select:  { id: true, status: true, numeroConectado: true, instanceName: true },
  });

  // Sync pull-based roda em background (after): não bloqueia a renderização.
  // O inbox mostra o estado atual do banco e o sync atualiza para a próxima visita.
  if (integracao?.status === "CONECTADO") {
    const { id: integracaoId, instanceName } = integracao;
    after(() =>
      sincronizarInstancia({ integracaoId, instanceName, intervaloMs: 5000 }).catch(() => {}),
    );
  }

  const conversas = integracao
    ? await prisma.conversaWpp.findMany({
        where:   {
          integracaoId: integracao.id,
          remoteJid: { not: "status@broadcast" },
          NOT: [
            { remoteJid: { startsWith: "0@" } },
            { remoteJid: { endsWith: "@g.us" } },
          ],
        },
        orderBy: { ultimaMensagem: "desc" },
        take:    100,
        include: {
          cliente:  { select: { nome: true } },
          mensagens: {
            orderBy: { timestamp: "desc" },
            take: 1,
            select: { corpo: true, fromMe: true, tipo: true },
          },
        },
      })
    : [];

  const avatarByJid = new Map<string, string>();
  if (integracao?.status === "CONECTADO") {
    const chats = await listarChatsComCache(integracao.instanceName, 150).catch(() => []);
    for (const c of chats) {
      if (!c.remoteJid || !c.profilePicUrl) continue;
      // A foto pode vir no chat @lid — indexa pelo JID canônico da conversa.
      const jid = jidCanonico(c.remoteJid, c.lastMessage?.key?.remoteJidAlt);
      if (!avatarByJid.has(jid)) avatarByJid.set(jid, c.profilePicUrl);
    }
  }

  const totalNaoLidas = conversas.reduce((s, c) => s + c.totalNaoLidas, 0);

  if (!integracao || integracao.status !== "CONECTADO") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-6 w-6" /> WhatsApp
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-semibold">WhatsApp não conectado</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Conecte um número WhatsApp para ver as conversas e enviar mensagens pelos seus clientes.
            </p>
            <Button asChild>
              <Link href={`/t/${slug}/whatsapp/configurar`}>
                <Settings className="mr-2 h-4 w-4" /> Conectar WhatsApp
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MessageCircle className="h-6 w-6" /> WhatsApp
            {totalNaoLidas > 0 && <Badge variant="destructive" className="text-xs">{totalNaoLidas}</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatarNumero(integracao.numeroConectado!)} · {conversas.length} conversa(s)
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/t/${slug}/whatsapp/configurar`}>
            <Settings className="mr-2 h-3.5 w-3.5" /> Configurações
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-r bg-[#f7f8fa]">
          <div className="border-b bg-[#f0f2f5] p-3">
            <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Search className="mr-2 inline h-4 w-4" />
              Buscar ou iniciar conversa
            </div>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto divide-y">
            {conversas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                Nenhuma conversa ainda.
              </div>
            ) : (
              conversas.map(c => {
                const ultimaMsg = c.mensagens[0];
                const nome = c.cliente?.nome ?? c.nomeContato ?? formatarNumero(jidParaNumero(c.remoteJid));
                const avatarUrl = avatarByJid.get(c.remoteJid);
                const temNaoLidas = c.totalNaoLidas > 0;
                return (
                  <Link
                    key={c.id}
                    href={`/t/${slug}/whatsapp/${c.id}`}
                    className="flex min-h-[72px] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[#ebedf0]"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={nome}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
                        {nome.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${temNaoLidas ? "font-semibold" : "font-medium"}`}>
                          {c.cliente && <User className="mr-1 inline h-3.5 w-3.5 text-primary" />}
                          {nome}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{tempoRelativo(c.ultimaMensagem)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className={`truncate text-xs ${temNaoLidas ? "text-foreground" : "text-muted-foreground"}`}>
                          {ultimaMsg?.fromMe ? "Você: " : ""}
                          {ultimaMsg ? (ultimaMsg.tipo !== "text" ? `[${ultimaMsg.tipo}]` : ultimaMsg.corpo) : "Sem mensagens"}
                        </p>
                        {temNaoLidas && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                            {c.totalNaoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section className="hidden h-[calc(100vh-16rem)] items-center justify-center bg-[#efeae2] text-center lg:flex">
          <div className="max-w-sm px-6">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">Selecione uma conversa para começar</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sua lista fica fixa à esquerda, como no WhatsApp Web.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
