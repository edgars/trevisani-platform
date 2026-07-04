"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Car, Database, FileSearch, HardDrive, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LimiteInfo, TipoRecurso } from "@/lib/plano/limites";

interface UsoCompleto {
  veiculos: LimiteInfo;
  usuarios: LimiteInfo;
  placas:   LimiteInfo;
  cnpjs:    LimiteInfo;
  storage:  LimiteInfo;
  alertas:  TipoRecurso[];
}

const RECURSO_META: Record<TipoRecurso, { label: string; icon: React.ElementType; format?: (n: number) => string }> = {
  veiculos: { label: "Veículos",         icon: Car },
  usuarios: { label: "Usuários",         icon: Users },
  placas:   { label: "Placas/mês",       icon: FileSearch },
  cnpjs:    { label: "CNPJs/mês",        icon: FileSearch },
  storage:  { label: "Storage",          icon: HardDrive, format: (b) => `${(b / 1024 / 1024).toFixed(0)} MB` },
};

function BarraUso({ info }: { info: LimiteInfo }) {
  const meta = RECURSO_META[info.recurso];
  const Icon = meta.icon;
  const ilimitado = info.limite === -1;
  const pct = Math.min(info.pct, 100);

  let barColor = "bg-emerald-500";
  if (pct >= 100) barColor = "bg-red-500";
  else if (pct >= 80) barColor = "bg-amber-500";

  const formatVal = meta.format ?? ((n) => String(n));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {meta.label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {ilimitado
            ? <span className="text-emerald-600 font-medium">Ilimitado</span>
            : `${formatVal(info.usado)} / ${formatVal(info.limite)}`}
        </span>
      </div>
      {!ilimitado && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PlanoUsageWidget({ uso, slug }: { uso: UsoCompleto; slug: string }) {
  const temAlertas = uso.alertas.length > 0;
  const planoNome  = uso.veiculos.planoNome;

  return (
    <Card className={temAlertas ? "border-amber-300 dark:border-amber-700" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            {temAlertas && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            Uso do plano <span className="font-normal text-muted-foreground">({planoNome})</span>
          </CardTitle>
          <Link
            href={`/t/${slug}/configuracoes/plano`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Ver plano <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {temAlertas && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Atenção: você está acima de 80% em {uso.alertas.length} recurso(s). Considere fazer upgrade.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <BarraUso info={uso.veiculos} />
          <BarraUso info={uso.usuarios} />
          <BarraUso info={uso.placas} />
          <BarraUso info={uso.cnpjs} />
          <BarraUso info={uso.storage} />
        </div>
      </CardContent>
    </Card>
  );
}
