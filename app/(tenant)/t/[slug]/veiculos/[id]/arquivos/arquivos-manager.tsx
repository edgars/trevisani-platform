"use client";

import { useRef, useState, useTransition } from "react";
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
  FilePlus2,
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  StickyNote,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  excluirDocumentoAction,
  atualizarTipoDocumentoAction,
  salvarAnotacaoTagsAction,
} from "./actions";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TipoDoc =
  | "NOTA_FISCAL"
  | "LAUDO_VISTORIA"
  | "CERTIFICADO_PROPRIEDADE"
  | "CONTRATO"
  | "FOTO_DOCUMENTO"
  | "OUTRO";

interface Documento {
  id: string;
  nome: string;
  url: string;
  mimeType: string;
  tamanhoBytes: number;
  tipo: TipoDoc;
  anotacao: string | null;
  tags: string[];
  createdAt: string;
}

interface Props {
  slug: string;
  veiculoId: string;
  documentosIniciais: Documento[];
  tagsExistentes: string[];
}

const TIPO_LABELS: Record<TipoDoc, string> = {
  NOTA_FISCAL:             "Nota Fiscal",
  LAUDO_VISTORIA:          "Laudo de Vistoria",
  CERTIFICADO_PROPRIEDADE: "Certificado de Propriedade",
  CONTRATO:                "Contrato",
  FOTO_DOCUMENTO:          "Foto de Documento",
  OUTRO:                   "Outro",
};

const TIPO_VARIANT: Record<TipoDoc, "default" | "secondary" | "success" | "warning" | "outline"> = {
  NOTA_FISCAL:             "success",
  LAUDO_VISTORIA:          "warning",
  CERTIFICADO_PROPRIEDADE: "default",
  CONTRATO:                "default",
  FOTO_DOCUMENTO:          "secondary",
  OUTRO:                   "outline",
};

// Tags padrão — exibidas quando não há tags do tenant ou como complemento
const TAGS_DEFAULT = [
  "urgente", "assinado", "pendente", "revisão", "original",
  "cópia", "digitalizado", "aprovado", "vistoriado", "quitado",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface FilePreview {
  id: string;
  file: File;
  tipo: TipoDoc;
}

// ─── Componente de anotações + tags por documento ────────────────────────────

function AnotacaoTagsPanel({
  slug,
  veiculoId,
  doc,
  tagsExistentes,
  onUpdate,
}: {
  slug: string;
  veiculoId: string;
  doc: Documento;
  tagsExistentes: string[];
  onUpdate: (id: string, anotacao: string | null, tags: string[]) => void;
}) {
  const [anotacao, setAnotacao] = useState(doc.anotacao ?? "");
  const [tags, setTags] = useState<string[]>(doc.tags);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  function adicionarTag(valor: string) {
    const tag = valor.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    dirty.current = true;
    setTagInput("");
  }

  function removerTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    dirty.current = true;
  }

  async function salvar() {
    setSaving(true);
    const result = await salvarAnotacaoTagsAction(slug, veiculoId, doc.id, anotacao, tags);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      dirty.current = false;
      onUpdate(doc.id, anotacao.trim() || null, tags);
      toast.success("Anotação salva.");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-muted bg-muted/20 p-3">
      {/* Anotação */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" />
          Anotação
        </div>
        <textarea
          value={anotacao}
          onChange={(e) => { setAnotacao(e.target.value); dirty.current = true; }}
          placeholder="Adicione uma anotação sobre este documento…"
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Tag className="h-3.5 w-3.5" />
          Tags
        </div>

        {/* Chips das tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removerTag(tag)}
                className="rounded-full hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Input de nova tag */}
          <div className="relative">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  adicionarTag(tagInput);
                }
              }}
              placeholder="+ tag"
              className="h-6 w-24 rounded-full border border-dashed border-input bg-background px-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Sugestões de tags: tenant primeiro, depois padrões como complemento */}
        {(() => {
          const sugeridas = tagInput.length > 0
            ? [...tagsExistentes, ...TAGS_DEFAULT]
                .filter((s, i, arr) => arr.indexOf(s) === i) // deduplica
                .filter((s) => !tags.includes(s) && s.includes(tagInput.toLowerCase()))
            : [...tagsExistentes, ...TAGS_DEFAULT]
                .filter((s, i, arr) => arr.indexOf(s) === i)
                .filter((s) => !tags.includes(s))
                .slice(0, 8);

          if (sugeridas.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1">
              {tagsExistentes.length > 0 && tagInput.length === 0 && (
                <span className="w-full text-[10px] text-muted-foreground/60">Usadas anteriormente:</span>
              )}
              {sugeridas.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => adicionarTag(s)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                    tagsExistentes.includes(s)
                      ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                      : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Salvar */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={salvar}
          className="h-7 gap-1.5 text-xs"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ArquivosManager({ slug, veiculoId, documentosIniciais, tagsExistentes }: Props) {
  const [docs, setDocs] = useState<Documento[]>(documentosIniciais);
  const [pendentes, setPendentes] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function toggleExpandido(id: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function adicionarArquivos(files: FileList | File[]) {
    const novos: FilePreview[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      tipo: "OUTRO" as TipoDoc,
    }));
    setPendentes((prev) => [...prev, ...novos]);
  }

  async function handleUpload() {
    if (pendentes.length === 0) return;
    setUploading(true);
    let erros = 0;

    for (const item of pendentes) {
      const fd = new FormData();
      fd.append("file",      item.file);
      fd.append("veiculoId", veiculoId);
      fd.append("tipo",      item.tipo);

      try {
        const res  = await fetch("/api/arquivos/veiculo", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`${item.file.name}: ${data.error ?? "Erro no upload"}`);
          erros++;
        } else {
          setDocs((prev) => [
            { ...data.documento, anotacao: null, tags: [], createdAt: new Date().toISOString() },
            ...prev,
          ]);
        }
      } catch {
        toast.error(`${item.file.name}: falha de rede`);
        erros++;
      }
    }

    setPendentes([]);
    setUploading(false);
    if (erros === 0) toast.success("Arquivo(s) enviado(s) com sucesso!");
  }

  function handleExcluir(docId: string) {
    if (!confirm("Excluir este documento?")) return;
    startTransition(async () => {
      const result = await excluirDocumentoAction(slug, veiculoId, docId);
      if (result.error) toast.error(result.error);
      else {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Documento excluído.");
      }
    });
  }

  function handleTipo(docId: string, tipo: TipoDoc) {
    startTransition(async () => {
      const result = await atualizarTipoDocumentoAction(slug, veiculoId, docId, tipo);
      if (result.error) toast.error(result.error);
      else setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, tipo } : d)));
    });
  }

  async function handleAbrir(docId: string) {
    setAbrindo(docId);
    try {
      const res = await fetch(`/api/arquivos/veiculo/${docId}/url`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Não foi possível gerar o link."); return; }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Erro de rede ao obter o link do documento.");
    } finally {
      setAbrindo(null);
    }
  }

  function handleAnotacaoTagsUpdate(id: string, anotacao: string | null, tags: string[]) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, anotacao, tags } : d)));
  }

  return (
    <div className="space-y-8">
      {/* ── Zona de upload ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Adicionar arquivos
        </h2>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); adicionarArquivos(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <FilePlus2 className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG ou WEBP · máx 20 MB · bucket privado</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && adicionarArquivos(e.target.files)}
          />
        </div>

        {pendentes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {pendentes.length} arquivo(s) aguardando envio
            </p>
            <div className="divide-y rounded-lg border">
              {pendentes.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  {item.file.type === "application/pdf" ? (
                    <FileText className="h-6 w-6 shrink-0 text-red-500" />
                  ) : (
                    <ImageIcon className="h-6 w-6 shrink-0 text-blue-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                  </div>
                  <select
                    value={item.tipo}
                    onChange={(e) =>
                      setPendentes((prev) =>
                        prev.map((p) =>
                          p.id === item.id ? { ...p, tipo: e.target.value as TipoDoc } : p,
                        ),
                      )
                    }
                    className="rounded border bg-background px-2 py-1 text-xs"
                  >
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendentes((prev) => prev.filter((p) => p.id !== item.id)); }}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando…" : `Enviar ${pendentes.length} arquivo(s)`}
            </Button>
          </div>
        )}
      </div>

      {/* ── Documentos existentes ─────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Arquivos cadastrados {docs.length > 0 && `(${docs.length})`}
        </h2>

        {docs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-card"
              >
                {/* Linha principal */}
                <div className="flex flex-wrap items-center gap-3 p-4">
                  {/* Ícone */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {doc.mimeType === "application/pdf" ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.nome}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(doc.tamanhoBytes)} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {/* Tags inline */}
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0 text-[10px] font-medium text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Indicador de anotação */}
                      {doc.anotacao && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600">
                          <StickyNote className="h-3 w-3" />
                          Anotação
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tipo */}
                  <select
                    value={doc.tipo}
                    disabled={isPending}
                    onChange={(e) => handleTipo(doc.id, e.target.value as TipoDoc)}
                    className="hidden rounded border bg-background px-2 py-1 text-xs disabled:opacity-50 sm:block"
                  >
                    {Object.entries(TIPO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <Badge variant={TIPO_VARIANT[doc.tipo]} className="hidden text-[10px] lg:inline-flex">
                    {TIPO_LABELS[doc.tipo]}
                  </Badge>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={abrindo === doc.id}
                      onClick={() => handleAbrir(doc.id)}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {abrindo === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      Abrir
                    </Button>

                    {/* Toggle anotações/tags */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandido(doc.id)}
                      className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                      title="Anotações e tags"
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                      {expandido.has(doc.id) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleExcluir(doc.id)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Painel expandível — anotações + tags */}
                {expandido.has(doc.id) && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <AnotacaoTagsPanel
                      slug={slug}
                      veiculoId={veiculoId}
                      doc={doc}
                      tagsExistentes={tagsExistentes}
                      onUpdate={handleAnotacaoTagsUpdate}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
