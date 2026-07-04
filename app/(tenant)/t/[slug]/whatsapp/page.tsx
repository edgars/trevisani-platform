import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Settings, User, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatarNumero, jidParaNumero } from "@/lib/integrations/whatsapp/evolution";

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
    select:  { id: true, status: true, numeroConectado: true },
  });

  const conversas = integracao
    ? await prisma.conversaWpp.findMany({
        where:   { integracaoId: integracao.id },
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-6 w-6" /> WhatsApp
            {totalNaoLidas > 0 && (
              <Badge variant="destructive" className="text-xs">{totalNaoLidas}</Badge>
            )}
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

      {conversas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              Nenhuma conversa ainda. As mensagens recebidas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden bg-card">
          {conversas.map(c => {
            const ultimaMsg = c.mensagens[0];
            const nome  = c.cliente?.nome ?? c.nomeContato ?? formatarNumero(jidParaNumero(c.remoteJid));
            const temNaoLidas = c.totalNaoLidas > 0;
            return (
              <Link
                key={c.id}
                href={`/t/${slug}/whatsapp/${c.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
                  {nome.slice(0, 2)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${temNaoLidas ? "font-semibold" : ""}`}>
                      {c.cliente && <User className="inline h-3.5 w-3.5 mr-1 text-primary" />}
                      {nome}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground">{tempoRelativo(c.ultimaMensagem)}</span>
                      {temNaoLidas && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                          {c.totalNaoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                  {ultimaMsg && (
                    <p className={`text-xs truncate mt-0.5 ${temNaoLidas ? "text-foreground" : "text-muted-foreground"}`}>
                      {ultimaMsg.fromMe ? "Você: " : ""}
                      {ultimaMsg.tipo !== "text" ? `[${ultimaMsg.tipo}]` : ultimaMsg.corpo}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
