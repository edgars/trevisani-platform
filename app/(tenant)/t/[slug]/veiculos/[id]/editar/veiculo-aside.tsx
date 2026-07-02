"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "veiculo:aside-collapsed";

export interface AsideFoto {
  id: string;
  url: string;
  legenda: string | null;
  destaque: boolean;
}

export interface AsideDocumento {
  id: string;
  nome: string;
  mimeType: string;
  tamanhoBytes: number;
  tipo: string;
}

const TIPO_DOC_LABEL: Record<string, string> = {
  NOTA_FISCAL: "Nota fiscal",
  LAUDO_VISTORIA: "Laudo de vistoria",
  CERTIFICADO_PROPRIEDADE: "Certificado",
  CONTRATO: "Contrato",
  FOTO_DOCUMENTO: "Foto de documento",
  OUTRO: "Outro",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VeiculoAside({
  slug,
  veiculoId,
  fotos,
  documentos,
}: {
  slug: string;
  veiculoId: string;
  fotos: AsideFoto[];
  documentos: AsideDocumento[];
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [abrindoDoc, setAbrindoDoc] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      return !v;
    });
  }

  async function abrirDocumento(doc: AsideDocumento) {
    setAbrindoDoc(doc.id);
    try {
      const res = await fetch(`/api/arquivos/veiculo/${doc.id}/url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao abrir documento.");
      window.open(data.url, "_blank", "noopener");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAbrindoDoc(null);
    }
  }

  // ── Rail colapsado ──
  if (collapsed) {
    return (
      <aside className="sticky top-6 flex w-12 shrink-0 flex-col items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapsed}
          className="h-9 w-9 rounded-xl"
          aria-label="Expandir painel lateral"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl" title={`Imagens (${fotos.length})`}>
          <Link href={`/t/${slug}/veiculos/${veiculoId}/fotos`}>
            <Images className="h-4 w-4 text-blue-500" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl" title={`Documentos (${documentos.length})`}>
          <Link href={`/t/${slug}/veiculos/${veiculoId}/arquivos`}>
            <FolderOpen className="h-4 w-4 text-amber-500" />
          </Link>
        </Button>
      </aside>
    );
  }

  return (
    <aside className="sticky top-6 flex w-full shrink-0 flex-col gap-4 lg:w-[320px]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Anexos do veículo</p>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8 rounded-xl"
          aria-label="Recolher painel lateral"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Imagens associadas ── */}
      <section className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium">Imagens associadas</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {fotos.length}
            </span>
          </div>
          <Link
            href={`/t/${slug}/veiculos/${veiculoId}/fotos`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Gerenciar
          </Link>
        </div>
        <div className="p-3">
          {fotos.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              Nenhuma imagem enviada.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((foto) => (
                <a
                  key={foto.id}
                  href={foto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                  title={foto.legenda ?? undefined}
                >
                  <Image
                    src={foto.url}
                    alt={foto.legenda ?? "Foto do veículo"}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {foto.destaque && (
                    <span className="absolute left-1 top-1 rounded-full bg-background/90 p-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Documentos ── */}
      <section className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium">Documentos</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {documentos.length}
            </span>
          </div>
          <Link
            href={`/t/${slug}/veiculos/${veiculoId}/arquivos`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Gerenciar
          </Link>
        </div>
        <div className="divide-y">
          {documentos.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Nenhum documento enviado.
            </p>
          ) : (
            documentos.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => abrirDocumento(doc)}
                disabled={abrindoDoc === doc.id}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{doc.nome}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {TIPO_DOC_LABEL[doc.tipo] ?? doc.tipo} · {formatBytes(doc.tamanhoBytes)}
                  </span>
                </span>
                {abrindoDoc === doc.id ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
              </button>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
