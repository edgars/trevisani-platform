import Image from "next/image";
import Link from "next/link";
import { requireWebsite } from "@/lib/tenant/resolver";
import { prisma } from "@/lib/db/client";
import { formatCentavos } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function VitrinePage({ params }: Params) {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  const cfg = tenant.websiteConfig;

  const destaques = await prisma.veiculo.findMany({
    where: {
      tenantId: tenant.id,
      status: "DISPONIVEL",
      fotos: { some: { destaque: true, status: "PRONTO_VENDA" } },
    },
    take: 6,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      marca: true,
      modelo: true,
      versao: true,
      anoModelo: true,
      anoFabricacao: true,
      kmAtual: true,
      precoVendaCentavos: true,
      fotos: {
        where: { destaque: true, status: "PRONTO_VENDA" },
        orderBy: { ordem: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  const whatsappUrl = cfg.whatsapp
    ? `https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[520px] flex-col items-center justify-center px-4 py-24 text-center"
        style={{ backgroundColor: "hsl(var(--site-primary))", color: "hsl(var(--site-primary-fg))" }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance max-w-3xl">
          {cfg.heroTitulo ?? `Bem-vindo à ${tenant.nome}`}
        </h1>
        {cfg.heroSubtitulo && (
          <p className="mt-4 max-w-xl text-lg opacity-80 text-balance">
            {cfg.heroSubtitulo}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/estoque"
            className="rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "hsl(var(--site-accent))",
              color: "hsl(var(--site-accent-fg))",
            }}
          >
            Ver estoque completo
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Fale pelo WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* Destaques */}
      {destaques.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Destaques do estoque</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((v) => (
              <Link
                key={v.id}
                href={`/veiculo/${v.id}`}
                className="group rounded-xl border overflow-hidden transition-shadow hover:shadow-card-hover"
              >
                {v.fotos[0] ? (
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <Image
                      src={v.fotos[0].url}
                      alt={`${v.marca} ${v.modelo}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
                    Sem foto
                  </div>
                )}
                <div className="p-4">
                  <p className="font-semibold">
                    {v.marca} {v.modelo}
                    {v.versao ? ` ${v.versao}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.anoFabricacao}/{v.anoModelo}
                    {v.kmAtual != null ? ` · ${v.kmAtual.toLocaleString("pt-BR")} km` : ""}
                  </p>
                  {v.precoVendaCentavos > 0 && (
                    <p
                      className="mt-2 text-lg font-bold"
                      style={{ color: "hsl(var(--site-accent))" }}
                    >
                      {formatCentavos(v.precoVendaCentavos)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/estoque"
              className="inline-flex items-center rounded-full border px-6 py-2 text-sm font-medium transition-colors hover:bg-accent"
              style={{ borderColor: "hsl(var(--site-primary) / 0.3)" }}
            >
              Ver todo o estoque →
            </Link>
          </div>
        </section>
      )}

      {/* Sobre */}
      {cfg.sobre && (
        <section className="bg-neutral-50 py-16">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">Sobre nós</h2>
            <p className="text-muted-foreground leading-relaxed">{cfg.sobre}</p>
          </div>
        </section>
      )}

      {/* CTA contato */}
      <section
        className="py-16"
        style={{ backgroundColor: "hsl(var(--site-accent))", color: "hsl(var(--site-accent-fg))" }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Encontrou seu carro?</h2>
          <p className="opacity-80 mb-6">
            Entre em contato e agende uma visita sem compromisso.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contato"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ color: "hsl(var(--site-accent))" }}
            >
              Enviar mensagem
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
