"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Veiculo { id: string; marca: string; modelo: string; anoModelo: number | null; placa: string | null; }

interface Props {
  slug: string;
  veiculos: Veiculo[];
  action: (prev: unknown, fd: FormData) => Promise<{ error?: string }>;
  defaults?: {
    titulo?: string;
    descricao?: string;
    veiculoId?: string;
    precoInicial?: number;
    incrementoMin?: number;
    dataInicio?: string;
    dataFim?: string;
  };
  submitLabel?: string;
}

function toDatetimeLocal(date?: Date | string) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LeilaoForm({ slug, veiculos, action, defaults, submitLabel = "Criar leilão" }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Dados do leilão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Título <span className="text-destructive">*</span></label>
            <input
              name="titulo" required defaultValue={defaults?.titulo}
              placeholder="Ex: Leilão de Veículos — Julho 2026"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              name="descricao" rows={3} defaultValue={defaults?.descricao}
              placeholder="Condições, regras ou observações do leilão..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {veiculos.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Veículo vinculado <span className="text-muted-foreground text-xs">(opcional)</span></label>
              <select
                name="veiculoId" defaultValue={defaults?.veiculoId ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— sem veículo específico —</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} {v.anoModelo}{v.placa ? ` · ${v.placa}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Valores e prazo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço inicial (R$) <span className="text-destructive">*</span></label>
              <input
                name="precoInicial" type="number" step="0.01" min="0" required
                defaultValue={defaults?.precoInicial ?? ""}
                placeholder="0,00"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Incremento mínimo (R$)</label>
              <input
                name="incrementoMin" type="number" step="0.01" min="0"
                defaultValue={defaults?.incrementoMin ?? "0"}
                placeholder="0,00 = qualquer valor acima"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data e hora de início <span className="text-destructive">*</span></label>
              <input
                name="dataInicio" type="datetime-local" required
                defaultValue={defaults?.dataInicio ?? toDatetimeLocal(new Date())}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data e hora de encerramento <span className="text-destructive">*</span></label>
              <input
                name="dataFim" type="datetime-local" required
                defaultValue={defaults?.dataFim}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
