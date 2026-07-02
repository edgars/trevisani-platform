import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWebsite } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params;
  const tenant = await requireWebsite(slug);
  const veiculo = await prisma.veiculo.findFirst({
    where: { id, tenantId: tenant.id, status: "DISPONIVEL" },
    select: { marca: true, modelo: true, anoModelo: true },
  });
  if (!veiculo) return { title: "Veículo não encontrado" };
  return {
    title: `${veiculo.marca} ${veiculo.modelo} ${veiculo.anoModelo}`,
  };
}

export default async function VeiculoPage({ params }: Params) {
  const { slug, id } = await params;
  const tenant = await requireWebsite(slug);

  const veiculo = await prisma.veiculo.findFirst({
    where: { id, tenantId: tenant.id, status: "DISPONIVEL" },
    select: {
      id: true,
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
      fotos: {
        where: { status: "PRONTO_VENDA" },
        orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
        select: { url: true, legenda: true, destaque: true },
      },
    },
  });

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

  return (
    <div className="container mx-auto px-4 py-10">
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
