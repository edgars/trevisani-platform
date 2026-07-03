import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { ConfigFiscalForm } from "./config-fiscal-form";

export const metadata = { title: "Configuração Fiscal" };

export default async function ConfiguracaoFiscalPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId!;

  const raw = await prisma.configuracaoFiscal.findUnique({ where: { tenantId } });
  const config = raw ? {
    regimeTributario: raw.regimeTributario,
    aliquotaImpostosPct: Number(raw.aliquotaImpostosPct),
    overheadMensalCentavos: raw.overheadMensalCentavos,
  } : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Configuração Fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Define o regime tributário, alíquota de impostos e overhead fixo mensal usados como base no DRE Planejado.
        </p>
      </div>
      <ConfigFiscalForm config={config} />
    </div>
  );
}
