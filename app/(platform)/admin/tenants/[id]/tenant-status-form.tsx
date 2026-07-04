"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { alterarStatusTenantAction, alterarPlanoTenantAction, alterarDescontoTenantAction, alterarFeatureTenantAction } from "./actions";

const STATUS_OPTIONS = [
  { value: "TRIAL",     label: "Trial" },
  { value: "ATIVO",     label: "Ativo" },
  { value: "SUSPENSO",  label: "Suspenso" },
  { value: "CANCELADO", label: "Cancelado" },
];

interface Plano { id: string; nome: string; }

interface Props {
  tenantId: string;
  currentStatus: string;
  planos: Plano[];
  currentPlanoId: string | null;
  descontoPercent: number;
  leilaoHabilitado: boolean;
  whatsappHabilitado: boolean;
}

export function TenantStatusForm({ tenantId, currentStatus, planos, currentPlanoId, descontoPercent, leilaoHabilitado, whatsappHabilitado }: Props) {
  const router = useRouter();
  const [status,    setStatus]    = React.useState(currentStatus);
  const [planoId,   setPlanoId]   = React.useState(currentPlanoId ?? "");
  const [desconto,  setDesconto]  = React.useState(String(descontoPercent));
  const [leilao,    setLeilao]    = React.useState(leilaoHabilitado);
  const [whatsapp,  setWhatsapp]  = React.useState(whatsappHabilitado);
  const [isPending, startTransition] = React.useTransition();

  function saveStatus() {
    startTransition(async () => {
      const result = await alterarStatusTenantAction(tenantId, status);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Status atualizado.");
      router.refresh();
    });
  }

  function savePlano() {
    if (!planoId) return;
    startTransition(async () => {
      const result = await alterarPlanoTenantAction(tenantId, planoId);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Plano atualizado.");
      router.refresh();
    });
  }

  function saveDesconto() {
    const pct = parseInt(desconto, 10);
    if (isNaN(pct)) return;
    startTransition(async () => {
      const result = await alterarDescontoTenantAction(tenantId, pct);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Desconto atualizado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 px-3 text-xs" onClick={saveStatus} disabled={isPending || status === currentStatus}>
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>

      {planos.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Plano</label>
          <div className="flex gap-2">
            <Select value={planoId} onValueChange={setPlanoId}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue placeholder="Selecionar plano..." />
              </SelectTrigger>
              <SelectContent>
                {planos.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={savePlano} disabled={isPending || planoId === currentPlanoId}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Desconto na mensalidade (0–100%)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number" min={0} max={100}
              value={desconto}
              onChange={e => setDesconto(e.target.value)}
              className="h-8 w-full rounded-md border bg-background px-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
          <Button
            size="sm" className="h-8 px-3 text-xs"
            onClick={saveDesconto}
            disabled={isPending || parseInt(desconto, 10) === descontoPercent}
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        {parseInt(desconto, 10) === 100 && (
          <p className="text-[10px] text-amber-600">Desconto de 100% — tenant não será cobrado.</p>
        )}
        {parseInt(desconto, 10) > 0 && parseInt(desconto, 10) < 100 && (
          <p className="text-[10px] text-muted-foreground">MRR efetivo reduzido em {desconto}%.</p>
        )}
      </div>

      {/* Feature flags */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-muted-foreground">Módulos opcionais</p>
        {[
          { key: "leilaoHabilitado" as const,   label: "Leilão de veículos",  desc: "Permite criar leilões públicos em tempo real",        value: leilao,   set: setLeilao },
          { key: "whatsappHabilitado" as const,  label: "WhatsApp integrado",  desc: "Inbox de conversas e agente IA via Evolution API",    value: whatsapp, set: setWhatsapp },
        ].map(feat => (
          <label key={feat.key} className="flex cursor-pointer items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium">{feat.label}</p>
              <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={feat.value}
              onClick={() => {
                const novo = !feat.value;
                feat.set(novo);
                startTransition(async () => {
                  const result = await alterarFeatureTenantAction(tenantId, feat.key, novo);
                  if (result.error) { toast.error(result.error); feat.set(!novo); return; }
                  toast.success(novo ? `${feat.label} habilitado.` : `${feat.label} desabilitado.`);
                  router.refresh();
                });
              }}
              disabled={isPending}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${feat.value ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${feat.value ? "translate-x-4" : "translate-x-1"}`} />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
