"use client";

import * as React from "react";
import { toast } from "sonner";
import { Gavel, Clock, Trophy, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCentavos } from "@/lib/utils";
import { darLanceAction, getLancesAction } from "../actions";

interface Lance {
  id: string;
  valorCentavos: number;
  createdAt: Date;
  cliente: { nome: string };
}

interface Cliente {
  id: string;
  nome: string;
}

interface Props {
  leilaoId: string;
  slug: string;
  initialStatus: string;
  initialPrecoAtual: number;
  initialLances: Lance[];
  dataFim: Date;
  incrementoMin: number;
  clientes: Cliente[];
}

function useCountdown(dataFim: Date) {
  const [diff, setDiff] = React.useState(() => dataFim.getTime() - Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setDiff(dataFim.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [dataFim]);
  if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0 };
  const total = Math.floor(diff / 1000);
  return {
    expired: false,
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function LeilaoLive({
  leilaoId, slug, initialStatus, initialPrecoAtual, initialLances, dataFim, incrementoMin, clientes,
}: Props) {
  const [lances, setLances] = React.useState<Lance[]>(initialLances);
  const [precoAtual, setPrecoAtual] = React.useState(initialPrecoAtual);
  const [status, setStatus] = React.useState(initialStatus);
  const [clienteId, setClienteId] = React.useState(clientes[0]?.id ?? "");
  const [valorInput, setValorInput] = React.useState(() =>
    ((initialPrecoAtual + incrementoMin) / 100).toFixed(2).replace(".", ",")
  );
  const [isPolling, setIsPolling] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const { expired, h, m, s } = useCountdown(dataFim);
  const isAtivo = status === "ATIVO" && !expired;

  // Poll every 3 seconds when auction is active
  React.useEffect(() => {
    if (!isAtivo) return;
    const interval = setInterval(async () => {
      setIsPolling(true);
      try {
        const data = await getLancesAction(leilaoId);
        if (data.precoAtual !== precoAtual) {
          setPrecoAtual(data.precoAtual);
          setLances(data.lances as Lance[]);
          setValorInput(((data.precoAtual + incrementoMin) / 100).toFixed(2).replace(".", ","));
        }
        setStatus(data.status);
      } finally {
        setIsPolling(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isAtivo, leilaoId, precoAtual, incrementoMin]);

  function submitLance() {
    const valor = parseFloat(valorInput.replace(",", "."));
    if (isNaN(valor) || valor <= 0) { toast.error("Informe um valor válido."); return; }
    if (!clienteId) { toast.error("Selecione um cliente."); return; }
    startTransition(async () => {
      const result = await darLanceAction(leilaoId, clienteId, valor);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Lance registrado com sucesso!");
      const data = await getLancesAction(leilaoId);
      setPrecoAtual(data.precoAtual);
      setLances(data.lances as Lance[]);
      setValorInput(((data.precoAtual + incrementoMin) / 100).toFixed(2).replace(".", ","));
    });
  }

  const maiorLance = lances[0];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Current bid + controls */}
      <div className="space-y-4 lg:col-span-2">
        {/* Status banner */}
        {status === "ENCERRADO" && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Leilão encerrado</p>
              {maiorLance && (
                <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                  Vencedor: <strong>{maiorLance.cliente.nome}</strong> com {formatCentavos(maiorLance.valorCentavos)}
                </p>
              )}
            </div>
          </div>
        )}
        {status === "CANCELADO" && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="font-semibold text-destructive">Leilão cancelado</p>
          </div>
        )}
        {expired && status === "ATIVO" && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Prazo encerrado. Aguardando processamento final…
            </p>
          </div>
        )}

        {/* Big price display */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lance atual</p>
                <p className="mt-1 text-4xl font-bold tabular-nums">{formatCentavos(precoAtual)}</p>
                {maiorLance && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    por <strong>{maiorLance.cliente.nome}</strong>
                  </p>
                )}
              </div>

              {/* Countdown */}
              {isAtivo && (
                <div className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Encerra em</p>
                  <div className="flex gap-1 text-2xl font-bold tabular-nums">
                    <span className={`rounded bg-muted px-2 py-1 ${h === 0 && m < 5 ? "text-red-500" : ""}`}>{pad(h)}</span>
                    <span className="py-1">:</span>
                    <span className={`rounded bg-muted px-2 py-1 ${h === 0 && m < 5 ? "text-red-500" : ""}`}>{pad(m)}</span>
                    <span className="py-1">:</span>
                    <span className={`rounded bg-muted px-2 py-1 ${h === 0 && m < 5 ? "text-red-500" : ""}`}>{pad(s)}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground uppercase">h  ·  m  ·  s</p>
                </div>
              )}

              {isPolling && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" /> ao vivo
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lance form */}
        {isAtivo && clientes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gavel className="h-4 w-4" />Dar lance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {incrementoMin > 0 && (
                <p className="text-xs text-muted-foreground">
                  Incremento mínimo: <strong>{formatCentavos(incrementoMin)}</strong> acima do lance atual
                </p>
              )}
              <div className="flex gap-3">
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <input
                    type="text"
                    value={valorInput}
                    onChange={e => setValorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submitLance(); }}
                    className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0,00"
                  />
                </div>
                <Button onClick={submitLance} disabled={isPending} className="min-w-[100px]">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gavel className="mr-2 h-4 w-4" />Dar lance</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isAtivo && clientes.length === 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Nenhum cliente cadastrado. Cadastre clientes para permitir lances.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "AGENDADO" && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center text-sm text-blue-700 dark:text-blue-400">
              <Clock className="mx-auto mb-2 h-6 w-6" />
              Este leilão ainda não foi iniciado.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Lance history */}
      <div>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Histórico de lances
              <Badge variant="secondary">{lances.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lances.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum lance ainda.</p>
            ) : (
              <ul className="divide-y max-h-[500px] overflow-y-auto">
                {lances.map((lance, i) => (
                  <li key={lance.id} className={`flex items-center justify-between px-4 py-3 ${i === 0 ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""}`}>
                    <div>
                      <p className="text-sm font-medium">{lance.cliente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lance.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold tabular-nums ${i === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-sm"}`}>
                        {formatCentavos(lance.valorCentavos)}
                      </p>
                      {i === 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Líder</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
