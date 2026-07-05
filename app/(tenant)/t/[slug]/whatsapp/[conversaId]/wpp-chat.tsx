"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCheck, ExternalLink, Loader2, Mic, Paperclip, Send, Smile, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { enviarMensagemAction, getMensagensAction, marcarLidasAction } from "@/lib/integrations/whatsapp/actions";

type Msg = {
  id: string;
  fromMe: boolean;
  corpo: string | null;
  tipo: string;
  timestamp: Date;
  lida: boolean;
};

interface Props {
  slug: string;
  conversaId: string;
  nome: string;
  numero: string;
  avatarUrl?: string;
  clienteId?: string;
  initialMensagens: Msg[];
}

function formatHora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

function formatDia(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

function isMesmoDia(a: Date, b: Date) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function WppChat({ slug, conversaId, nome, numero, avatarUrl, clienteId, initialMensagens }: Props) {
  const [mensagens, setMensagens] = React.useState<Msg[]>(initialMensagens);
  const [texto, setTexto]         = React.useState("");
  const [sending, startSend]      = React.useTransition();
  const [typing, setTyping]       = React.useState(false);
  const bottomRef                 = React.useRef<HTMLDivElement>(null);
  const typingTimerRef            = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark as read on mount
  React.useEffect(() => {
    marcarLidasAction(slug, conversaId).catch(() => {});
  }, [slug, conversaId]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // Polling curto para sincronizar mensagens novas + status de leitura (check azul)
  React.useEffect(() => {
    const id = setInterval(async () => {
      const snapshot = await getMensagensAction(slug, conversaId);
      setMensagens(prev => {
        const prevIds = new Set(prev.map(m => m.id));
        const incomingNew = snapshot.some(m => !m.fromMe && !prevIds.has(m.id));
        if (incomingNew) {
          setTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTyping(false), 3500);
        }
        return snapshot;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [slug, conversaId]);

  React.useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  function handleSend() {
    const t = texto.trim();
    if (!t) return;
    startSend(async () => {
      setTexto("");
      const result = await enviarMensagemAction(slug, conversaId, t);
      if (result.error) {
        toast.error(result.error);
        setTexto(t);
      } else {
        // Optimista: bolha imediata (confirmada no próximo polling)
        setMensagens(prev => [
          ...prev,
          { id: result.messageId ?? crypto.randomUUID(), fromMe: true, corpo: t, tipo: "text", timestamp: new Date(), lida: false },
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div
      className="flex h-[calc(100vh-12rem)] min-h-[460px] flex-col"
      style={{
        backgroundColor: "#efeae2",
        backgroundImage:
          "radial-gradient(rgba(11,20,26,0.055) 0.75px, transparent 0.75px), radial-gradient(rgba(11,20,26,0.03) 0.75px, transparent 0.75px)",
        backgroundSize: "24px 24px, 24px 24px",
        backgroundPosition: "0 0, 12px 12px",
      }}
    >
      <div className="flex items-center gap-3 border-b bg-[#f0f2f5] px-4 py-3">
        <Button asChild variant="ghost" size="icon" className="lg:hidden">
          <Link href={`/t/${slug}/whatsapp`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nome}
            className="h-11 w-11 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase">
            {nome.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nome}</p>
          <p className={`truncate text-xs ${typing ? "text-emerald-600" : "text-muted-foreground"}`}>
            {numero} · {typing ? "digitando..." : "online agora"}
          </p>
        </div>
        {clienteId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/${slug}/clientes/${clienteId}/editar`}>
              <User className="mr-1.5 h-3.5 w-3.5" />
              Ver cliente
              <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
            </Link>
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-1.5 p-4 md:px-8">
        {mensagens.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            Nenhuma mensagem ainda.
          </p>
        )}
        {mensagens.map((m, idx) => (
          <React.Fragment key={m.id}>
            {(idx === 0 || !isMesmoDia(mensagens[idx - 1].timestamp, m.timestamp)) && (
              <div className="my-3 flex justify-center">
                <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
                  {formatDia(m.timestamp)}
                </span>
              </div>
            )}

            <div className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-[7.5px] px-2.5 py-1.5 text-[13.5px] leading-5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                m.fromMe
                  ? "bg-[#d9fdd3] text-foreground rounded-br-sm"
                  : "bg-white text-foreground rounded-bl-sm"
              }`}>
                {m.tipo === "text" ? (
                  <p className="whitespace-pre-wrap break-words">{m.corpo}</p>
                ) : (
                  <p className="italic text-xs opacity-70">[{m.tipo}]</p>
                )}
                <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
                  m.fromMe ? "text-emerald-700/80" : "text-muted-foreground"
                }`}>
                  {formatHora(m.timestamp)}
                  {m.fromMe && (
                    <CheckCheck className={`h-3.5 w-3.5 ${m.lida ? "text-[#53bdeb]" : "text-[#8696a0]"}`} />
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 border-t bg-[#f0f2f5] px-3 py-2">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 shadow-sm">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            placeholder="Digite uma mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="max-h-28 min-h-10 resize-none border-0 px-2 py-2 text-sm shadow-none focus-visible:ring-0"
            disabled={sending}
          />
          <Button
            onClick={texto.trim() ? handleSend : undefined}
            disabled={sending}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : texto.trim() ? (
              <Send className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
