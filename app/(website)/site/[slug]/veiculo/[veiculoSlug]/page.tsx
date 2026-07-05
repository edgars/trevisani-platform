import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWebsite } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

interface Params {
  params: Promise<{ slug: string; veiculoSlug: string }>;
}

const VEICULO_SELECT = {
  id: true,
  slug: true,
  marca: true,
  modelo: true,
  versao: true,
  anoFabricacao: true,
  anoModelo: true,
  cor: true,
  combustivel: true,
  cambio: true,
  kmAtual: true,
  categoria: true,
  precoVendaCentavos: true,
  observacoes: true,
  updatedAt: true,
  fotos: {
    where: { status: "PRONTO_VENDA" },
    orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
    select: { url: true, legenda: true, destaque: true },
  },
} satisfies Prisma.VeiculoSelect;

/** Descrição curta (~155 caracteres) para <meta name="description"> e OG. */
function montarDescricao(
  v: { marca: string; modelo: string; versao: string | null; anoFabricacao: number; anoModelo: number; kmAtual: number | null; combustivel: string | null; cambio: string | null; precoVendaCentavos: number; observacoes: string | null },
  tenantNome: string,
): string {
  const partes = [
    `${v.marca} ${v.modelo}${v.versao ? ` ${v.versao}` : ""}`,
    `${v.anoFabricacao}/${v.anoModelo}`,
    v.kmAtual != null ? `${v.kmAtual.toLocaleString("pt-BR")} km` : null,
    v.combustivel ?? null,
    v.cambio ?? null,
    v.precoVendaCentavos > 0 ? `por ${formatCentavos(v.precoVendaCentavos)}` : null,
  ].filter(Boolean);

  const base = `${partes.join(" · ")} — disponível na ${tenantNome}.`;
  if (v.observacoes) {
    const extra = ` ${v.observacoes.replace(/\s+/g, " ").trim()}`;
    return `${base}${extra}`.slice(0, 155).trim();
  }
  return base.slice(0, 155).trim();
}

async function buscarVeiculo(tenantId: string, veiculoSlug: string) {
  return prisma.veiculo.findFirst({
    where: { slug: veiculoSlug, tenantId, status: "DISPONIVEL" },
    select: VEICULO_SELECT,
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, veiculoSlug } = await params;
  const tenant = await requireWebsite(slug);
  const veiculo = await buscarVeiculo(tenant.id, veiculoSlug);
  if (!veiculo) return { title: "Veículo não encontrado" };

  const cfg = tenant.websiteConfig;
  const titulo = `${veiculo.marca} ${veiculo.modelo}${veiculo.versao ? ` ${veiculo.versao}` : ""} ${veiculo.anoModelo}`;
  const descricao = montarDescricao(veiculo, tenant.nome);
  const canonical = `${getTenantPublicUrl(slug)}/veiculo/${veiculo.slug}`;
  const imagemDestaque = veiculo.fotos[0]?.url ?? cfg.logoUrl ?? undefined;

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: titulo,
      description: descricao,
      url: canonical,
      siteName: tenant.nome,
      ...(imagemDestaque ? { images: [{ url: imagemDestaque, width: 1200, height: 900, alt: titulo }] } : {}),
    },
    twitter: {
      card: imagemDestaque ? "summary_large_image" : "summary",
      title: titulo,
      description: descricao,
      ...(imagemDestaque ? { images: [imagemDestaque] } : {}),
    },
  };
}

export default async function VeiculoPage({ params }: Params) {
  const { slug, veiculoSlug } = await params;
  const tenant = await requireWebsite(slug);
  const veiculo = await buscarVeiculo(tenant.id, veiculoSlug);
  if (!veiculo) notFound();

  const cfg = tenant.websiteConfig;
  const whatsappUrl = cfg.whatsapp
    ? `https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Tenho interesse no ${veiculo.marca} ${veiculo.modelo} ${veiculo.anoModelo} anunciado em ${tenant.nome}.`,
      )}`
    : null;

  const ficha: Array<{ label: string; value: string | number | null | undefined }> = [
    { label: "Marca", value: veiculo.marca },
    { label: "Modelo", value: veiculo.modelo },
    { label: "Versão", value: veiculo.versao },
    { label: "Ano Fab./Modelo", value: `${veiculo.anoFabricacao}/${veiculo.anoModelo}` },
    { label: "Cor", value: veiculo.cor },
    { label: "Combustível", value: veiculo.combustivel },
    { label: "Câmbio", value: veiculo.cambio },
    {
      label: "Quilometragem",
      value:
        veiculo.kmAtual != null ? `${veiculo.kmAtual.toLocaleString("pt-BR")} km` : null,
    },
    { label: "Categoria", value: veiculo.categoria },
  ].filter((item) => item.value != null && item.value !== "");

  const canonical = `${getTenantPublicUrl(slug)}/veiculo/${veiculo.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${veiculo.marca} ${veiculo.modelo}${veiculo.versao ? ` ${veiculo.versao}` : ""}`,
    brand: veiculo.marca,
    model: veiculo.modelo,
    vehicleModelDate: String(veiculo.anoModelo),
    productionDate: String(veiculo.anoFabricacao),
    ...(veiculo.cor ? { color: veiculo.cor } : {}),
    ...(veiculo.cambio ? { vehicleTransmission: veiculo.cambio } : {}),
    ...(veiculo.combustivel ? { fuelType: veiculo.combustivel } : {}),
    ...(veiculo.kmAtual != null
      ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: veiculo.kmAtual, unitCode: "KMT" } }
      : {}),
    ...(veiculo.fotos.length > 0 ? { image: veiculo.fotos.map((f) => f.url) } : {}),
    url: canonical,
    ...(veiculo.precoVendaCentavos > 0
      ? {
          offers: {
            "@type": "Offer",
            price: (veiculo.precoVendaCentavos / 100).toFixed(2),
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: canonical,
            seller: { "@type": "AutoDealer", name: tenant.nome },
          },
        }
      : {}),
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/estoque"
        className="text-sm text-muted-foreground hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Voltar ao estoque
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Galeria */}
        <div className="space-y-4">
          {veiculo.fotos.length > 0 ? (
            <>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-100">
                <Image
                  src={veiculo.fotos[0].url}
                  alt={`${veiculo.marca} ${veiculo.modelo}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
              </div>
              {veiculo.fotos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {veiculo.fotos.slice(1).map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100"
                    >
                      <Image
                        src={f.url}
                        alt={f.legenda ?? `Foto ${i + 2}`}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[16/10] rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
              Sem fotos disponíveis
            </div>
          )}
        </div>

        {/* Ficha lateral */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {veiculo.marca} {veiculo.modelo}
              {veiculo.versao ? ` ${veiculo.versao}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {veiculo.anoFabricacao}/{veiculo.anoModelo}
              {veiculo.kmAtual != null
                ? ` · ${veiculo.kmAtual.toLocaleString("pt-BR")} km`
                : ""}
            </p>
          </div>

          {veiculo.precoVendaCentavos > 0 && (
            <p
              className="text-3xl font-black"
              style={{ color: "hsl(var(--site-accent))" }}
            >
              {formatCentavos(veiculo.precoVendaCentavos)}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25d366" }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Tenho interesse — WhatsApp
              </a>
            )}
            <Link
              href="/contato"
              className="flex items-center justify-center rounded-xl border py-3 text-sm font-medium transition-colors hover:bg-neutral-50"
            >
              Enviar mensagem
            </Link>
          </div>

          {/* Ficha técnica */}
          <div className="rounded-xl border divide-y">
            {ficha.map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right">{String(value)}</span>
              </div>
            ))}
          </div>

          {veiculo.observacoes && (
            <div className="rounded-xl border p-4 text-sm">
              <p className="font-semibold mb-1">Observações</p>
              <p className="text-muted-foreground whitespace-pre-line">{veiculo.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
