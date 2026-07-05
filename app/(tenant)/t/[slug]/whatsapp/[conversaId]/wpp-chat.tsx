"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCheck, Loader2, Send } from "lucide-react";

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
  initialMensagens: Msg[];
}

function formatHora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function WppChat({ slug, conversaId, initialMensagens }: Props) {
  const [mensagens, setMensagens] = React.useState<Msg[]>(initialMensagens);
  const [texto, setTexto]         = React.useState("");
  const [sending, startSend]      = React.useTransition();
  const bottomRef                 = React.useRef<HTMLDivElement>(null);

  // Mark as read on mount
  React.useEffect(() => {
    marcarLidasAction(slug, conversaId).catch(() => {});
  }, [slug, conversaId]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  // Poll every 5 seconds for new messages
  React.useEffect(() => {
    const last = () => mensagens.at(-1)?.timestamp;
    const id = setInterval(async () => {
      const novas = await getMensagensAction(slug, conversaId, last() ?? undefined);
      if (novas.length > 0) {
        setMensagens(prev => {
          const ids = new Set(prev.map(m => m.id));
          return [...prev, ...novas.filter(m => !ids.has(m.id))];
        });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [slug, conversaId, mensagens]);

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
        // Optimistic: add fake message (will be confirmed by next poll)
        setMensagens(prev => [
          ...prev,
          { id: result.messageId ?? crypto.randomUUID(), fromMe: true, corpo: t, tipo: "text", timestamp: new Date(), lida: true },
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[460px] flex-col bg-[#efeae2]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {mensagens.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            Nenhuma mensagem ainda.
          </p>
        )}
        {mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-lg px-3 py-2 text-sm shadow-sm ${
              m.fromMe
                ? "bg-[#d9fdd3] text-foreground rounded-br-sm"
                : "bg-white text-foreground rounded-bl-sm"
            }`}>
              {m.tipo === "text" ? (
                <p className="whitespace-pre-wrap break-words">{m.corpo}</p>
              ) : (
                <p className="italic text-xs opacity-70">[{m.tipo}]</p>
              )}
              <div className={`flex items-center gap-1 mt-0.5 justify-end text-[10px] ${
                m.fromMe ? "text-emerald-700/80" : "text-muted-foreground"
              }`}>
                {formatHora(m.timestamp)}
                {m.fromMe && <CheckCheck className={`h-3 w-3 ${m.lida ? "text-sky-500" : "text-emerald-700/70"}`} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 border-t bg-[#f0f2f5] p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm">
        <Textarea
          placeholder="Digite uma mensagem... (Enter para enviar)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none flex-1 border-0 shadow-none focus-visible:ring-0"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !texto.trim()}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
        </div>
      </div>
    </div>
  );
}
