import type { Metadata } from "next";
import { requireWebsite } from "@/lib/tenant/resolver";
import { getSocialLinks } from "@/lib/website/social-icons";
import { ContatoForm } from "./contato-form";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  return { title: `Contato · ${tenant.nome}` };
}

export default async function ContatoPage({ params }: Params) {
  const { slug } = await params;
  const tenant = await requireWebsite(slug);
  const cfg = tenant.websiteConfig;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-2 max-w-4xl mx-auto">
        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">Entre em contato</h1>
          <p className="text-muted-foreground mb-8">
            Preencha o formulário e nossa equipe retornará em breve. Você também pode
            nos contatar diretamente pelos canais abaixo.
          </p>

          <ul className="space-y-4 text-sm">
            {cfg.telefone && (
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs"
                  style={{ backgroundColor: "hsl(var(--site-primary))" }}
                >
                  ☎
                </span>
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-muted-foreground">{cfg.telefone}</p>
                </div>
              </li>
            )}

            {cfg.whatsapp && (
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white text-xs">
                  W
                </span>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <a
                    href={`https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:underline"
                  >
                    {cfg.whatsapp}
                  </a>
                </div>
              </li>
            )}

            {cfg.endereco && (
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs"
                  style={{ backgroundColor: "hsl(var(--site-primary))" }}
                >
                  📍
                </span>
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-muted-foreground">{cfg.endereco}</p>
                </div>
              </li>
            )}

            {getSocialLinks(cfg).map(({ key, label, href, Icon }) => (
              <li key={key} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "hsl(var(--site-primary))" }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">{label}</p>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:underline break-all"
                  >
                    {href.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Formulário */}
        <div className="rounded-2xl border p-8 bg-white shadow-card">
          <h2 className="text-lg font-semibold mb-6">Envie uma mensagem</h2>
          <ContatoForm tenantId={tenant.id} whatsapp={cfg.whatsapp} />
        </div>
      </div>
    </div>
  );
}
