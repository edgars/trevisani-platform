"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Star,
  StarOff,
  Trash2,
  Upload,
  X,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  excluirFotoAction,
  setDestaqueAction,
  atualizarStatusFotoAction,
} from "./actions";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type StatusFoto = "BATIDO" | "EM_REPARO" | "PRONTO_VENDA";

interface Foto {
  id: string;
  url: string;
  legenda: string | null;
  status: StatusFoto;
  destaque: boolean;
  ordem: number;
}

interface Props {
  slug: string;
  veiculoId: string;
  fotosIniciais: Foto[];
}

// ─── Configuração de status ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusFoto, { label: string; variant: "destructive" | "warning" | "success" }> = {
  BATIDO:       { label: "Batido",         variant: "destructive" },
  EM_REPARO:    { label: "Em reparo",      variant: "warning"     },
  PRONTO_VENDA: { label: "Pronto p/ venda", variant: "success"   },
};

// ─── Preview de arquivo pendente ─────────────────────────────────────────────

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
  status: StatusFoto;
  legenda: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FotosManager({ slug, veiculoId, fotosIniciais }: Props) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciais);
  const [pendentes, setPendentes] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // ─── Adicionar arquivos à fila ───────────────────────────────────────────

  function adicionarArquivos(files: FileList | File[]) {
    const novos: FilePreview[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "PRONTO_VENDA" as StatusFoto,
        legenda: "",
      }));
    setPendentes((prev) => [...prev, ...novos]);
  }

  function removerPendente(id: string) {
    setPendentes((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  // ─── Upload ──────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (pendentes.length === 0) return;
    setUploading(true);
    let erros = 0;

    for (const item of pendentes) {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("veiculoId", veiculoId);
      fd.append("status", item.status);
      if (item.legenda) fd.append("legenda", item.legenda);

      try {
        const res = await fetch("/api/fotos/veiculo", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`${item.file.name}: ${data.error ?? "Erro no upload"}`);
          erros++;
        } else {
          URL.revokeObjectURL(item.previewUrl);
          setFotos((prev) => [...prev, data.foto]);
        }
      } catch {
        toast.error(`${item.file.name}: falha de rede`);
        erros++;
      }
    }

    setPendentes([]);
    setUploading(false);
    if (erros === 0) toast.success("Fotos enviadas com sucesso!");
  }

  // ─── Ações em fotos existentes ───────────────────────────────────────────

  function handleExcluir(fotoId: string) {
    if (!confirm("Excluir esta foto?")) return;
    startTransition(async () => {
      const result = await excluirFotoAction(slug, veiculoId, fotoId);
      if (result.error) toast.error(result.error);
      else {
        setFotos((prev) => prev.filter((f) => f.id !== fotoId));
        toast.success("Foto excluída.");
      }
    });
  }

  function handleDestaque(fotoId: string) {
    startTransition(async () => {
      const result = await setDestaqueAction(slug, veiculoId, fotoId);
      if (result.error) toast.error(result.error);
      else {
        setFotos((prev) =>
          prev.map((f) => ({ ...f, destaque: f.id === fotoId })),
        );
        toast.success("Foto destaque definida.");
      }
    });
  }

  function handleStatus(fotoId: string, status: StatusFoto) {
    startTransition(async () => {
      const result = await atualizarStatusFotoAction(slug, veiculoId, fotoId, status);
      if (result.error) toast.error(result.error);
      else {
        setFotos((prev) =>
          prev.map((f) => (f.id === fotoId ? { ...f, status } : f)),
        );
      }
    });
  }

  // ─── Drag & drop na zona de upload ──────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave() {
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) adicionarArquivos(e.dataTransfer.files);
  }

  return (
    <div className="space-y-8">
      {/* ── Zona de upload ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Adicionar fotos
        </h2>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Arraste fotos aqui ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP · máx 10 MB por foto</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && adicionarArquivos(e.target.files)}
          />
        </div>

        {/* Pré-visualização dos arquivos pendentes */}
        {pendentes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {pendentes.length} foto(s) aguardando envio
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pendentes.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-lg border bg-muted/10"
                >
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removerPendente(item.id); }}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="p-2">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        setPendentes((prev) =>
                          prev.map((p) =>
                            p.id === item.id
                              ? { ...p, status: e.target.value as StatusFoto }
                              : p,
                          ),
                        )
                      }
                      className="w-full rounded border bg-background px-1.5 py-1 text-xs"
                    >
                      <option value="PRONTO_VENDA">Pronto p/ venda</option>
                      <option value="EM_REPARO">Em reparo</option>
                      <option value="BATIDO">Batido</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Legenda (opcional)"
                      value={item.legenda}
                      onChange={(e) =>
                        setPendentes((prev) =>
                          prev.map((p) =>
                            p.id === item.id ? { ...p, legenda: e.target.value } : p,
                          ),
                        )
                      }
                      className="mt-1.5 w-full rounded border bg-background px-1.5 py-1 text-xs placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando…" : `Enviar ${pendentes.length} foto(s)`}
            </Button>
          </div>
        )}
      </div>

      {/* ── Fotos existentes ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fotos cadastradas {fotos.length > 0 && `(${fotos.length})`}
        </h2>

        {fotos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma foto cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fotos
              .sort((a, b) => a.ordem - b.ordem || (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0))
              .map((foto) => {
                const cfg = STATUS_CONFIG[foto.status];
                return (
                  <div
                    key={foto.id}
                    className={`relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-card-hover ${
                      foto.destaque ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                  >
                    {/* Destaque badge */}
                    {foto.destaque && (
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        <Star className="h-3 w-3 fill-current" />
                        Destaque
                      </div>
                    )}

                    {/* Imagem */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Image
                        src={foto.url}
                        alt={foto.legenda ?? "Foto do veículo"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>

                    {/* Info + ações */}
                    <div className="space-y-2 p-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant={cfg.variant} className="text-[10px]">
                          {cfg.label}
                        </Badge>
                      </div>

                      {foto.legenda && (
                        <p className="truncate text-xs text-muted-foreground">{foto.legenda}</p>
                      )}

                      {/* Status selector */}
                      <select
                        value={foto.status}
                        disabled={isPending}
                        onChange={(e) => handleStatus(foto.id, e.target.value as StatusFoto)}
                        className="w-full rounded border bg-background px-1.5 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="PRONTO_VENDA">Pronto p/ venda</option>
                        <option value="EM_REPARO">Em reparo</option>
                        <option value="BATIDO">Batido</option>
                      </select>

                      {/* Botões */}
                      <div className="flex gap-1.5">
                        {!foto.destaque && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDestaque(foto.id)}
                            className="h-7 flex-1 gap-1 text-xs"
                          >
                            <Star className="h-3 w-3" />
                            Destaque
                          </Button>
                        )}
                        {foto.destaque && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-7 flex-1 gap-1 text-xs text-primary"
                          >
                            <StarOff className="h-3 w-3" />
                            É destaque
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleExcluir(foto.id)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
