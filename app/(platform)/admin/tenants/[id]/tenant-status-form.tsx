"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { alterarStatusTenantAction, alterarPlanoTenantAction } from "./actions";

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
}

export function TenantStatusForm({ tenantId, currentStatus, planos, currentPlanoId }: Props) {
  const router = useRouter();
  const [status, setStatus]   = React.useState(currentStatus);
  const [planoId, setPlanoId] = React.useState(currentPlanoId ?? "");
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
    </div>
  );
}
