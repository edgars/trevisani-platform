"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle2, Loader2, QrCode, RefreshCw, Smartphone, Trash2, Unplug, Wifi, WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatarNumero } from "@/lib/integrations/whatsapp/evolution";
import {
  conectarWhatsAppAction,
  desconectarWhatsAppAction,
  removerInstanciaAction,
  statusWhatsAppAction,
} from "@/lib/integrations/whatsapp/actions";

interface Props {
  slug: string;
  initialStatus: string;
  initialNumero?: string | null;
  initialQr?: string | null;
}

const STATUS_META = {
  CONECTADO:     { label: "Conectado",        color: "bg-emerald-500", badge: "success" as const },
  AGUARDANDO_QR: { label: "Aguardando QR",    color: "bg-amber-500",   badge: "warning" as const },
  DESCONECTADO:  { label: "Desconectado",     color: "bg-muted-foreground/40", badge: "secondary" as const },
  ERRO:          { label: "Erro de conexão",  color: "bg-red-500",     badge: "destructive" as const },
};

export function WppConfigurar({ slug, initialStatus, initialNumero, initialQr }: Props) {
  const [status, setStatus]  = React.useState(initialStatus);
  const [numero, setNumero]  = React.useState<string | null>(initialNumero ?? null);
  const [qrCode, setQrCode]  = React.useState<string | null>(initialQr ?? null);
  const [pending, startTransition] = React.useTransition();

  const meta = STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.DESCONECTADO;

  // Poll every 3s while waiting for QR scan
  React.useEffect(() => {
    if (status !== "AGUARDANDO_QR" && status !== "CONECTADO") return;
    if (status === "CONECTADO") return;

    const id = setInterval(async () => {
      const data = await statusWhatsAppAction(slug);
      if (data.status !== status) {
        setStatus(data.status);
        setNumero(data.numero ?? null);
        if (data.status === "CONECTADO") setQrCode(null);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [status, slug]);

  function handleConectar() {
    startTransition(async () => {
      const result = await conectarWhatsAppAction(slug);
      if (result.error) { toast.error(result.error); return; }
      setStatus(result.status ?? "AGUARDANDO_QR");
      setQrCode(result.qrCode ?? null);
    });
  }

  function handleDesconectar() {
    startTransition(async () => {
      const result = await desconectarWhatsAppAction(slug);
      if (result.error) { toast.error(result.error); return; }
      setStatus("DESCONECTADO");
      setNumero(null);
      setQrCode(null);
      toast.success("WhatsApp desconectado.");
    });
  }

  function handleRemover() {
    if (!confirm("Remover a instância apagará todo o histórico de mensagens. Continuar?")) return;
    startTransition(async () => {
      await removerInstanciaAction(slug);
      setStatus("DESCONECTADO");
      setNumero(null);
      setQrCode(null);
      toast.success("Instância removida.");
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4" /> Status da conexão
            </CardTitle>
            <Badge variant={meta.badge}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${meta.color}`} />
              {meta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "CONECTADO" && numero && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">WhatsApp ativo</p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                  Número conectado: <strong>{formatarNumero(numero)}</strong>
                </p>
              </div>
            </div>
          )}

          {status === "AGUARDANDO_QR" && qrCode && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-xl border bg-white p-3 shadow-sm">
                <Image
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  width={240}
                  height={240}
                  className="rounded"
                  unoptimized
                />
              </div>
              <div className="text-center">
                <p className="font-medium">Escaneie o QR Code</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-amber-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguardando scan...
                </div>
              </div>
            </div>
          )}

          {status === "AGUARDANDO_QR" && !qrCode && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando QR code...
            </div>
          )}

          {(status === "DESCONECTADO" || status === "ERRO") && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <WifiOff className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                Nenhum número conectado. Clique em &ldquo;Conectar&rdquo; para gerar o QR Code.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {(status === "DESCONECTADO" || status === "ERRO") && (
              <Button onClick={handleConectar} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                Conectar WhatsApp
              </Button>
            )}
            {status === "AGUARDANDO_QR" && (
              <Button onClick={handleConectar} variant="outline" disabled={pending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
                Gerar novo QR
              </Button>
            )}
            {status === "CONECTADO" && (
              <Button onClick={handleDesconectar} variant="outline" disabled={pending}>
                <Unplug className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            )}
            {status !== "DESCONECTADO" && (
              <Button onClick={handleRemover} variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto" disabled={pending}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remover instância
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" /> Como conectar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {[
              "Recomendamos usar um número dedicado à loja (chip separado do pessoal).",
              'Clique em "Conectar WhatsApp" — um QR Code será gerado.',
              "No celular, abra o WhatsApp e toque em ⋮ (três pontos) → Dispositivos conectados.",
              'Toque em "Conectar dispositivo" e aponte a câmera para o QR Code.',
              "Pronto! As conversas aparecerão no inbox desta plataforma.",
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
