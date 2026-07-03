import { prisma } from "@/lib/db/client";
import { TiposEventoManager } from "./tipos-evento-manager";

export const metadata = { title: "Tipos de Evento" };

export default async function AdminEventosPage() {
  const tipos = await prisma.tipoEvento.findMany({
    orderBy: { slug: "asc" },
    include: { _count: { select: { registros: true } } },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tipos de evento</h1>
        <p className="text-sm text-muted-foreground">
          Eventos cobráveis monitorados pela plataforma (ex: consulta de placa, CNPJ, uploads).
        </p>
      </div>
      <TiposEventoManager tipos={tipos} />
    </div>
  );
}
