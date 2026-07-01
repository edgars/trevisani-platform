import { PhaseStub } from "@/components/portal/phase-stub";
export const metadata = { title: "Compras" };
export default function ComprasPage() {
  return (
    <PhaseStub
      title="Compras"
      description="Registro de aquisições a partir de ofertas aceitas ou lançamentos manuais, com condições de pagamento e vínculo ao estoque."
      phase="Fase 1 · Núcleo operacional"
    />
  );
}
