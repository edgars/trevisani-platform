"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DreVeiculoSelector({
  slug,
  veiculos,
  defaultDe,
  defaultAte,
  defaultVeiculoId,
}: {
  slug: string;
  veiculos: { id: string; label: string }[];
  defaultDe: string;
  defaultAte: string;
  defaultVeiculoId: string;
}) {
  const router = useRouter();
  const [de, setDe] = React.useState(defaultDe);
  const [ate, setAte] = React.useState(defaultAte);
  const [veiculoId, setVeiculoId] = React.useState(defaultVeiculoId);

  function apply() {
    const p = new URLSearchParams();
    if (de) p.set("de", de);
    if (ate) p.set("ate", ate);
    if (veiculoId) p.set("veiculoId", veiculoId);
    router.push(`/t/${slug}/financeiro/dre?${p}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Período de</label>
        <Input type="date" value={de} onChange={e => setDe(e.target.value)} className="h-9 w-36" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Até</label>
        <Input type="date" value={ate} onChange={e => setAte(e.target.value)} className="h-9 w-36" />
      </div>
      <div className="flex-1 min-w-[200px] space-y-1">
        <label className="text-xs font-medium text-muted-foreground">DRE por Veículo (opcional)</label>
        <select
          value={veiculoId}
          onChange={e => setVeiculoId(e.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">— DRE Geral —</option>
          {veiculos.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>
      <Button onClick={apply} size="sm">Aplicar</Button>
      <Button onClick={() => { setDe(""); setAte(""); setVeiculoId(""); router.push(`/t/${slug}/financeiro/dre`); }} size="sm" variant="outline">
        Limpar
      </Button>
    </div>
  );
}
