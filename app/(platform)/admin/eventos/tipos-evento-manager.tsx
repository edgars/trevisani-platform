"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Zap, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCentavos } from "@/lib/utils";
import {
  criarTipoEventoAction,
  atualizarTipoEventoAction,
  excluirTipoEventoAction,
  seedTiposEventoPadraoAction,
} from "./actions";

interface TipoEvento {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  precoCentavos: number;
  ativo: boolean;
  _count: { registros: number };
}

interface Props { tipos: TipoEvento[]; }

interface FormState { open: boolean; editing?: TipoEvento; }

export function TiposEventoManager({ tipos }: Props) {
  const [list, setList]   = React.useState(tipos);
  const [form, setForm]   = React.useState<FormState>({ open: false });
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function openNew()                 { setForm({ open: true }); }
  function openEdit(t: TipoEvento)   { setForm({ open: true, editing: t }); }
  function closeForm()               { setForm({ open: false }); setError(""); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const result = form.editing
        ? await atualizarTipoEventoAction(form.editing.id, null, fd)
        : await criarTipoEventoAction(null, fd);
      if (result?.error) { setError(result.error); return; }
      toast.success(form.editing ? "Tipo atualizado!" : "Tipo criado!");
      window.location.reload();
    });
  }

  function handleDelete(t: TipoEvento) {
    if (!confirm(`Excluir "${t.nome}"?`)) return;
    startTransition(async () => {
      const result = await excluirTipoEventoAction(t.id);
      if (result.error) { toast.error(result.error); return; }
      toast.success("Tipo removido.");
      setList(l => l.filter(x => x.id !== t.id));
    });
  }

  function handleSeed() {
    startTransition(async () => {
      await seedTiposEventoPadraoAction();
      toast.success("Tipos padrão criados/atualizados.");
      window.location.reload();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={openNew} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />Novo tipo
        </Button>
        <Button variant="outline" onClick={handleSeed} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Usar tipos padrão
        </Button>
      </div>

      <div className="space-y-2">
        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum tipo configurado. Use &ldquo;Tipos padrão&rdquo; para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {list.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex items-center gap-2">
                  {t.ativo
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    : <Circle className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{t.nome}</span>
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.slug}</code>
                    <Badge variant={t.precoCentavos > 0 ? "default" : "secondary"}>
                      {t.precoCentavos > 0 ? formatCentavos(t.precoCentavos) + "/evento" : "Gratuito"}
                    </Badge>
                  </div>
                  {t.descricao && <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{t._count.registros.toLocaleString("pt-BR")} registros</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t)} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário */}
      <Dialog open={form.open} onOpenChange={(o: boolean) => { if (!o) closeForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.editing ? "Editar tipo de evento" : "Novo tipo de evento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" defaultValue={form.editing?.slug} placeholder="consulta_placa" pattern="[a-z0-9_]+" required disabled={!!form.editing} />
              <p className="text-[11px] text-muted-foreground">Minúsculas e underscores. Imutável após criar.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" defaultValue={form.editing?.nome} placeholder="Consulta de Placa" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" defaultValue={form.editing?.descricao ?? ""} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precoCentavos">Preço unitário (centavos)</Label>
              <Input id="precoCentavos" name="precoCentavos" type="number" min={0} defaultValue={form.editing?.precoCentavos ?? 0} />
              <p className="text-[11px] text-muted-foreground">0 = incluso no plano / gratuito</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo" name="ativo" defaultChecked={form.editing?.ativo ?? true} className="h-4 w-4 rounded border" />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
