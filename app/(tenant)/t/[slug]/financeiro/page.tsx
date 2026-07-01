import { PhaseStub } from "@/components/portal/phase-stub";
export const metadata = { title: "Financeiro" };
export default function FinanceiroPage() {
  return (
    <PhaseStub
      title="Financeiro"
      description="Contas a pagar/receber, parcelas, fluxo de caixa e DRE simplificado."
      phase="Fase 1 · Núcleo operacional"
    />
  );
}
