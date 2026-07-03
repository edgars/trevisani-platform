"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  uploadDocumentoClienteAction,
  excluirDocumentoClienteAction,
} from "../../actions";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DocData {
  id: string;
  nome: string;
  url: string;
  mimeType: string;
  tamanhoBytes: number;
  descricao: string | null;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const MIME_ICON: Record<string, string> = {
  "application/pdf": "📄",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/webp": "🖼️",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function DocumentosManager({
  slug,
  clienteId,
  documentos: initial,
}: {
  slug: string;
  clienteId: string;
  documentos: DocData[];
}) {
  const [docs, setDocs] = React.useState(initial);
  const [uploading, setUploading] = React.useState(false);
  const [descricao, setDescricao] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("descricao", descricao);
    setUploading(true);
    const { error, doc } = await uploadDocumentoClienteAction(slug, clienteId, fd);
    setUploading(false);
    if (error) {
      toast.error(error);
    } else if (doc) {
      setDocs((prev) => [
        {
          id: doc.id,
          nome: doc.nome,
          url: doc.url,
          mimeType: file.type,
          tamanhoBytes: file.size,
          descricao: descricao || null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setDescricao("");
      toast.success("Documento enviado com sucesso.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleExcluir(docId: string) {
    if (!confirm("Excluir este documento?")) return;
    const { error } = await excluirDocumentoClienteAction(slug, docId);
    if (error) toast.error(error);
    else setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm font-medium">Adicionar documento</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Ex: CNH, Comprovante de residência, Contrato..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={uploading}
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              } ${uploading ? "cursor-wait opacity-60" : ""}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Arraste ou clique para selecionar
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PDF, imagens, Word — máx 10 MB
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <div className="space-y-2">
        {docs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento anexado ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-card"
            >
              <span className="text-2xl shrink-0">
                {MIME_ICON[doc.mimeType] ?? "📎"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.descricao && <span className="mr-2">{doc.descricao}</span>}
                  {formatBytes(doc.tamanhoBytes)} · {formatDate(doc.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Abrir documento"
                >
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Excluir documento"
                  onClick={() => handleExcluir(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
