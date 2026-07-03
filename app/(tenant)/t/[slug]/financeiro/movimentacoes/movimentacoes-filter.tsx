"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MovimentacoesFilter({ slug }: { slug: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [tipo, setTipo] = React.useState(sp.get("tipo") ?? "");
  const [status, setStatus] = React.useState(sp.get("status") ?? "");
  const [de, setDe] = React.useState(sp.get("de") ?? "");
  const [ate, setAte] = React.useState(sp.get("ate") ?? "");
  const [q, setQ] = React.useState(sp.get("q") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (tipo)   params.set("tipo", tipo);
    if (status) params.set("status", status);
    if (de)     params.set("de", de);
    if (ate)    params.set("ate", ate);
    if (q)      params.set("q", q);
    router.push(`/t/${slug}/financeiro/movimentacoes?${params}`);
  }

  function clear() {
    setTipo(""); setStatus(""); setDe(""); setAte(""); setQ("");
    router.push(`/t/${slug}/financeiro/movimentacoes`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1 min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Todos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="SAIDA">Saídas</option>
        </select>
      </div>
      <div className="space-y-1 min-w-[140px]">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Todos</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Liquidado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">De</label>
        <Input type="date" value={de} onChange={e => setDe(e.target.value)} className="h-9 w-36" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Até</label>
        <Input type="date" value={ate} onChange={e => setAte(e.target.value)} className="h-9 w-36" />
      </div>
      <div className="flex-1 space-y-1 min-w-[160px]">
        <label className="text-xs font-medium text-muted-foreground">Buscar</label>
        <Input placeholder="Descrição..." value={q} onChange={e => setQ(e.target.value)}
          className="h-9" onKeyDown={e => e.key === "Enter" && apply()} />
      </div>
      <div className="flex gap-2">
        <Button onClick={apply} size="sm">Filtrar</Button>
        <Button onClick={clear} size="sm" variant="outline">Limpar</Button>
      </div>
    </div>
  );
}
