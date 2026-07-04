import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { WppConfigurar } from "./wpp-configurar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurar WhatsApp" };

export default async function WppConfigurarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant]  = await Promise.all([requireTenantPorSlug(slug), requireSession()]);
  if (!tenant.whatsappHabilitado) notFound();

  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where:  { tenantId: tenant.id },
    select: { status: true, numeroConectado: true, qrCode: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurar WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte o número da loja para ativar o inbox e as automações.
        </p>
      </div>
      <WppConfigurar
        slug={slug}
        initialStatus={integracao?.status ?? "DESCONECTADO"}
        initialNumero={integracao?.numeroConectado}
        initialQr={integracao?.qrCode}
      />
    </div>
  );
}
