import { PhaseStub } from "@/components/portal/phase-stub";
export const metadata = { title: "Portal do Cliente" };
export default function CustomerHomePage() {
  return (
    <PhaseStub
      title="Portal do Cliente"
      description="Acompanhe propostas, assine contratos e veja o status da sua compra."
      phase="Fase 1 · Núcleo operacional"
    />
  );
}
