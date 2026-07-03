"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Car, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { cn, formatCentavos } from "@/lib/utils";

function diasNoEstoque(dataChegada: string | null): number | null {
  if (!dataChegada) return null;
  const diff = Date.now() - new Date(dataChegada).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
import { atualizarStatusVeiculoAction } from "./actions";
import {
  STAGE_CONFIG,
  STAGE_ORDER,
  type StageVeiculo,
  type VeiculoResumo,
} from "./status";

export function VeiculosKanban({
  slug,
  veiculos: initial,
  className,
}: {
  slug: string;
  veiculos: VeiculoResumo[];
  className?: string;
}) {
  const router = useRouter();
  // Estado otimista: reflete o drag imediatamente; o server action confirma.
  const [veiculos, setVeiculos] = React.useState(initial);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<StageVeiculo | null>(null);

  React.useEffect(() => setVeiculos(initial), [initial]);

  function handleDrop(stage: StageVeiculo) {
    setOverStage(null);
    if (!dragId) return;
    const veiculo = veiculos.find((v) => v.id === dragId);
    setDragId(null);
    if (!veiculo || veiculo.status === stage) return;

    const previous = veiculos;
    setVeiculos((vs) =>
      vs.map((v) => (v.id === veiculo.id ? { ...v, status: stage } : v)),
    );

    atualizarStatusVeiculoAction(slug, veiculo.id, stage).then((result) => {
      if (result.error) {
        setVeiculos(previous);
        toast.error(result.error);
      } else {
        toast.success(
          `${veiculo.marca} ${veiculo.modelo} → ${STAGE_CONFIG[stage].label}`,
        );
      }
    });
  }

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {STAGE_ORDER.map((stage) => {
        const cfg = STAGE_CONFIG[stage];
        const items = veiculos.filter((v) => v.status === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOverStage((s) => (s === stage ? null : s));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(stage);
            }}
            className={cn(
              "flex h-full w-[272px] shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors",
              overStage === stage && dragId && "border-primary/40 bg-accent",
            )}
          >
            {/* Header da coluna */}
            <div className="flex shrink-0 items-center gap-2 px-3 py-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cfg.label}
              </p>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {items.length}
              </span>
            </div>

            {/* Cards — scrollável individualmente por coluna */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Arraste um veículo para cá
                </div>
              )}
              {items.map((v) => (
                <div
                  key={v.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(v.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  onClick={() => router.push(`/t/${slug}/veiculos/${v.id}/editar`)}
                  className={cn(
                    "group cursor-pointer rounded-xl border bg-background p-2.5 shadow-card transition-all hover:shadow-card-hover",
                    dragId === v.id && "opacity-50",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Miniatura (foto de destaque) */}
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {v.thumbUrl ? (
                        <Image
                          src={v.thumbUrl}
                          alt={`${v.marca} ${v.modelo}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Car className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {v.marca} {v.modelo}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.versao ?? v.cor ?? "—"} · {v.anoFabricacao}/{v.anoModelo}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatCentavos(v.precoVendaCentavos)}
                      </p>
                    </div>
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {v.placa && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {v.placa}
                      </span>
                    )}
                    {(() => {
                      const dias = diasNoEstoque(v.dataChegada);
                      if (dias === null) return null;
                      const cor =
                        dias <= 30
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : dias <= 60
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400";
                      return (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            cor,
                          )}
                          title="Dias no estoque desde que ficou disponível"
                        >
                          {dias}d estoque
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
