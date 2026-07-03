"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  criarChecklistAction,
  atualizarItemChecklistAction,
  concluirChecklistAction,
  adicionarFotoItemAction,
  removerFotoItemAction,
} from "./actions";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CategoriaItem = "LATARIA" | "MOTOR" | "PNEUS" | "ESTOFADO";
type StatusChecklist = "PENDENTE" | "CONCLUIDO";

const CATEGORIA_LABEL: Record<CategoriaItem, string> = {
  LATARIA: "Lataria",
  MOTOR: "Motor",
  PNEUS: "Pneus",
  ESTOFADO: "Estofado / Interior",
};

const CATEGORIA_ICON: Record<CategoriaItem, string> = {
  LATARIA: "🚗",
  MOTOR: "⚙️",
  PNEUS: "🔄",
  ESTOFADO: "💺",
};

interface FotoItem {
  id: string;
  url: string;
}

interface ItemData {
  id: string;
  categoria: CategoriaItem;
  ok: boolean | null;
  observacao: string | null;
  dataVerificacao: string | null;
  fotos: FotoItem[];
}

export interface ChecklistData {
  id: string;
  titulo: string;
  status: StatusChecklist;
  realizadoEm: string | null;
  createdAt: string;
  itens: ItemData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function nextOk(current: boolean | null): boolean | null {
  if (current === null) return true;
  if (current === true) return false;
  return null;
}

// ─── Sub-componente: item do checklist ────────────────────────────────────────

function ChecklistItem({
  slug,
  item,
  concluido,
  onChange,
}: {
  slug: string;
  item: ItemData;
  concluido: boolean;
  onChange: (updated: ItemData) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [uploadingFoto, setUploadingFoto] = React.useState(false);
  const [showObs, setShowObs] = React.useState(!!item.observacao);
  const [obs, setObs] = React.useState(item.observacao ?? "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function toggleOk() {
    if (concluido) return;
    const novo = nextOk(item.ok);
    setSaving(true);
    onChange({ ...item, ok: novo });
    const { error } = await atualizarItemChecklistAction(slug, item.id, novo);
    setSaving(false);
    if (error) {
      onChange({ ...item }); // rollback
      toast.error(error);
    }
  }

  async function salvarObs() {
    if (concluido) return;
    setSaving(true);
    const { error } = await atualizarItemChecklistAction(slug, item.id, item.ok, obs);
    setSaving(false);
    if (error) {
      toast.error(error);
    } else {
      onChange({ ...item, observacao: obs });
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("foto", file);
    setUploadingFoto(true);
    const { error, foto } = await adicionarFotoItemAction(slug, item.id, fd);
    setUploadingFoto(false);
    if (error) {
      toast.error(error);
    } else if (foto) {
      onChange({ ...item, fotos: [...item.fotos, foto] });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removerFoto(fotoId: string) {
    const { error } = await removerFotoItemAction(slug, fotoId);
    if (error) {
      toast.error(error);
    } else {
      onChange({ ...item, fotos: item.fotos.filter((f) => f.id !== fotoId) });
    }
  }

  const okColor =
    item.ok === true
      ? "bg-emerald-500 border-emerald-500 text-white"
      : item.ok === false
        ? "bg-red-500 border-red-500 text-white"
        : "bg-muted border-border text-muted-foreground";

  const okLabel =
    item.ok === true ? "OK" : item.ok === false ? "NOK" : "—";

  return (
    <div className="rounded-lg border bg-background p-3 space-y-2">
      {/* Header do item */}
      <div className="flex items-center gap-2">
        <span className="text-base">{CATEGORIA_ICON[item.categoria]}</span>
        <span className="flex-1 text-sm font-medium">
          {CATEGORIA_LABEL[item.categoria]}
        </span>

        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

        {/* Toggle OK / NOK */}
        <button
          type="button"
          onClick={toggleOk}
          disabled={concluido || saving}
          title={
            item.ok === null
              ? "Clique para marcar como OK"
              : item.ok
                ? "Clique para marcar como NOK"
                : "Clique para limpar"
          }
          className={cn(
            "flex h-7 min-w-[3rem] items-center justify-center rounded-full border px-2 text-xs font-bold transition-colors",
            okColor,
            !concluido && "cursor-pointer hover:opacity-80",
            concluido && "cursor-default opacity-70",
          )}
        >
          {okLabel}
        </button>

        {/* Botão observação */}
        {!concluido && (
          <button
            type="button"
            onClick={() => setShowObs((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            {showObs ? "Fechar obs." : "Observação"}
          </button>
        )}

        {/* Botão foto */}
        {!concluido && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              title="Adicionar foto"
              className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {uploadingFoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFotoUpload}
            />
          </>
        )}

        {/* Contagem de fotos */}
        {item.fotos.length > 0 && (
          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            {item.fotos.length} foto{item.fotos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Observação */}
      {showObs && !concluido && (
        <div className="flex gap-2">
          <Textarea
            className="text-xs min-h-[56px] resize-none"
            placeholder="Descreva o problema ou observação..."
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={salvarObs}
          />
        </div>
      )}

      {/* Observação salva (somente leitura quando concluído) */}
      {concluido && item.observacao && (
        <p className="text-xs text-muted-foreground italic">{item.observacao}</p>
      )}

      {/* Fotos em miniatura */}
      {item.fotos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.fotos.map((foto) => (
            <div key={foto.id} className="relative h-12 w-16 group">
              <a href={foto.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={foto.url}
                  alt="Foto do item"
                  fill
                  sizes="64px"
                  className="rounded-md object-cover"
                />
              </a>
              {!concluido && (
                <button
                  type="button"
                  onClick={() => removerFoto(foto.id)}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: card de checklist ────────────────────────────────────────

function ChecklistCard({
  slug,
  checklist: initial,
}: {
  slug: string;
  checklist: ChecklistData;
}) {
  const [checklist, setChecklist] = React.useState(initial);
  const [expanded, setExpanded] = React.useState(initial.status === "PENDENTE");
  const [concluding, setConcluding] = React.useState(false);

  const todosAvaliados = checklist.itens.every((it) => it.ok !== null);
  const concluido = checklist.status === "CONCLUIDO";

  function updateItem(updated: ItemData) {
    setChecklist((prev) => ({
      ...prev,
      itens: prev.itens.map((it) => (it.id === updated.id ? updated : it)),
    }));
  }

  async function handleConcluir() {
    setConcluding(true);
    const { error } = await concluirChecklistAction(slug, checklist.id);
    setConcluding(false);
    if (error) {
      toast.error(error);
    } else {
      setChecklist((prev) => ({ ...prev, status: "CONCLUIDO", realizadoEm: new Date().toISOString() }));
      toast.success("Checklist concluído!");
    }
  }

  const okCount = checklist.itens.filter((it) => it.ok === true).length;
  const nokCount = checklist.itens.filter((it) => it.ok === false).length;

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-medium">{checklist.titulo}</span>

        {concluido ? (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] h-5">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Concluído
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] h-5">
            Pendente
          </Badge>
        )}

        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDate(checklist.realizadoEm ?? checklist.createdAt)}
        </span>
      </button>

      {/* Itens expandidos */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Resumo rápido */}
          <div className="flex gap-3 text-xs text-muted-foreground pt-1 pb-0.5">
            <span className="text-emerald-600 font-medium">{okCount} OK</span>
            <span className="text-red-500 font-medium">{nokCount} NOK</span>
            <span>{checklist.itens.length - okCount - nokCount} pendente{checklist.itens.length - okCount - nokCount !== 1 ? "s" : ""}</span>
          </div>

          {checklist.itens.map((item) => (
            <ChecklistItem
              key={item.id}
              slug={slug}
              item={item}
              concluido={concluido}
              onChange={updateItem}
            />
          ))}

          {!concluido && (
            <Button
              size="sm"
              className="w-full mt-1"
              disabled={!todosAvaliados || concluding}
              onClick={handleConcluir}
            >
              {concluding ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              )}
              {todosAvaliados
                ? "Concluir inspeção"
                : `Avalie todos os itens (${checklist.itens.filter((it) => it.ok === null).length} restante${checklist.itens.filter((it) => it.ok === null).length !== 1 ? "s" : ""})`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ChecklistSection({
  slug,
  veiculoId,
  checklists: initial,
}: {
  slug: string;
  veiculoId: string;
  checklists: ChecklistData[];
}) {
  const [checklists, setChecklists] = React.useState(initial);
  const [creating, setCreating] = React.useState(false);

  const pendentes = checklists.filter((c) => c.status === "PENDENTE").length;
  const concluidos = checklists.filter((c) => c.status === "CONCLUIDO").length;

  async function handleNovaInspecao() {
    setCreating(true);
    const { error, id } = await criarChecklistAction(slug, veiculoId);
    setCreating(false);
    if (error || !id) {
      toast.error(error ?? "Erro ao criar checklist.");
      return;
    }
    // Adiciona otimisticamente com estrutura mínima; o revalidatePath vai atualizar
    const novo: ChecklistData = {
      id,
      titulo: `Inspeção #${checklists.length + 1}`,
      status: "PENDENTE",
      realizadoEm: null,
      createdAt: new Date().toISOString(),
      itens: [
        { id: `tmp-lat-${id}`, categoria: "LATARIA", ok: null, observacao: null, dataVerificacao: null, fotos: [] },
        { id: `tmp-mot-${id}`, categoria: "MOTOR", ok: null, observacao: null, dataVerificacao: null, fotos: [] },
        { id: `tmp-pne-${id}`, categoria: "PNEUS", ok: null, observacao: null, dataVerificacao: null, fotos: [] },
        { id: `tmp-est-${id}`, categoria: "ESTOFADO", ok: null, observacao: null, dataVerificacao: null, fotos: [] },
      ],
    };
    setChecklists((prev) => [...prev, novo]);
    toast.success("Checklist criado.");
  }

  return (
    <section className="rounded-xl border bg-card shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-medium">Check Lists</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {checklists.length}
          </span>
          {pendentes > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              {pendentes} pendente{pendentes !== 1 ? "s" : ""}
            </span>
          )}
          {concluidos > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {concluidos} ✓
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={handleNovaInspecao}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Nova inspeção
        </Button>
      </div>

      {/* Checklists */}
      <div className="p-3 space-y-2">
        {checklists.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
            <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p>Nenhum checklist criado.</p>
            <p className="text-[11px]">
              Crie um para inspecionar lataria, motor, pneus e estofado.
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Obrigatório ao reservar ou vender o veículo.
            </p>
          </div>
        ) : (
          checklists.map((c) => (
            <ChecklistCard key={c.id} slug={slug} checklist={c} />
          ))
        )}
      </div>
    </section>
  );
}
