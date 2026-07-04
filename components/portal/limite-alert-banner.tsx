import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getUsoCompleto } from "@/lib/plano/limites";

const LABELS: Record<string, string> = {
  veiculos: "veículos",
  usuarios: "usuários",
  placas:   "consultas de placa",
  cnpjs:    "consultas de CNPJ",
  storage:  "storage",
};

interface Props {
  tenantId: string;
  slug: string;
}

export async function LimiteAlertBanner({ tenantId, slug }: Props) {
  const uso = await getUsoCompleto(tenantId);
  if (uso.alertas.length === 0) return null;

  // Only show critical (>=100%) or warning (>=80%)
  const criticos  = uso.alertas.filter(r => uso[r].pct >= 100);
  const avisos    = uso.alertas.filter(r => uso[r].pct < 100);

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2 text-xs ${criticos.length > 0 ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800 text-red-700 dark:text-red-400" : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-700 dark:text-amber-400"}`}>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        {criticos.length > 0 ? (
          <>
            <strong>Limite atingido</strong> em: {criticos.map(r => LABELS[r]).join(", ")}.
            Novos cadastros nessas categorias estão bloqueados.
          </>
        ) : (
          <>
            <strong>Atenção:</strong> você está acima de 80% em: {avisos.map(r => LABELS[r]).join(", ")}.
          </>
        )}
        {" "}
        <Link href={`/t/${slug}/configuracoes/plano`} className="underline underline-offset-2 font-semibold">
          Ver plano & upgrade →
        </Link>
      </span>
    </div>
  );
}
