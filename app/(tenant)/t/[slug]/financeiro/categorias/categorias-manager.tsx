"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight, Loader2, Plus, Trash2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  criarCategoriaAction,
  excluirCategoriaAction,
  criarItemCategoriaAction,
  excluirItemCategoriaAction,
  seedCategoriasPadraoAction,
} from "./actions";

interface ItemData { id: string; nome: string; ativo: boolean; }
interface CatData {
  id: string; nome: string; tipo: "ENTRADA" | "SAIDA";
  cor: string | null; icone: string | null; ativo: boolean;
  movimentacoes: number; itens: ItemData[];
}

function CategoriaCard({ cat, onDelete }: { cat: CatData; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [novoItem, setNovoItem] = React.useState("");
  const [itens, setItens] = React.useState(cat.itens);
  const [isPending, startTransition] = React.useTransition();
  const isReceita = cat.tipo === "ENTRADA";

  function handleAdicionarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!novoItem.trim()) return;
    const fd = new FormData();
    fd.set("nome", novoItem.trim());
    startTransition(async () => {
      const r = await criarItemCategoriaAction(cat.id, null, fd);
      if (r?.error) toast.error(r.error);
      else {
        setItens(prev => [...prev, { id: Date.now().toString(), nome: novoItem.trim(), ativo: true }]);
        setNovoItem("");
        toast.success("Item adicionado.");
        window.location.reload();
      }
    });
  }

  function handleRemoverItem(itemId: string) {
    if (!confirm("Excluir este item?")) return;
    startTransition(async () => {
      const r = await excluirItemCategoriaAction(itemId);
      if (r?.error) toast.error(r.error);
      else setItens(prev => prev.filter(i => i.id !== itemId));
    });
  }

  return (
    <Card className={`border-l-4 transition-all`} style={{ borderLeftColor: cat.cor ?? (isReceita ? "#4ade80" : "#f87171") }}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isReceita
              ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
              : <ArrowUpRight className="h-4 w-4 shrink-0 text-red-500" />
            }
            <div className="min-w-0">
              <p className="font-medium truncate">{cat.nome}</p>
              <p className="text-xs text-muted-foreground">{cat.movimentacoes} mov. · {itens.length} item(ns)</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant={isReceita ? "secondary" : "destructive"} className={`text-[10px] ${isReceita ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}>
              {isReceita ? "Receita" : "Despesa"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(cat.id)} disabled={cat.movimentacoes > 0}
              title={cat.movimentacoes > 0 ? "Não é possível excluir: há movimentações vinculadas" : "Excluir categoria"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Itens / Subcategorias</p>
            {itens.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
                <span>{item.nome}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemoverItem(item.id)} disabled={isPending}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <form onSubmit={handleAdicionarItem} className="flex gap-2 pt-1">
              <Input
                placeholder="Novo item..."
                value={novoItem}
                onChange={e => setNovoItem(e.target.value)}
                className="h-8 text-sm"
                disabled={isPending}
              />
              <Button type="submit" size="sm" className="h-8 shrink-0" disabled={isPending || !novoItem.trim()}>
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoriasManager({ slug, categorias: initial }: { slug: string; categorias: CatData[] }) {
  const [categorias, setCategorias] = React.useState(initial);
  const [isPending, startTransition] = React.useTransition();
  const [novoNome, setNovoNome] = React.useState("");
  const [novoTipo, setNovoTipo] = React.useState<"ENTRADA" | "SAIDA">("SAIDA");
  const [novaCor, setNovaCor] = React.useState("#f87171");

  const receitas = categorias.filter(c => c.tipo === "ENTRADA");
  const despesas = categorias.filter(c => c.tipo === "SAIDA");

  function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("nome", novoNome.trim());
    fd.set("tipo", novoTipo);
    fd.set("cor", novaCor);
    startTransition(async () => {
      const r = await criarCategoriaAction(null, fd);
      if (r?.error) toast.error(r.error);
      else { toast.success("Categoria criada!"); setNovoNome(""); window.location.reload(); }
    });
  }

  function handleExcluir(id: string) {
    if (!confirm("Excluir categoria?")) return;
    startTransition(async () => {
      const r = await excluirCategoriaAction(id);
      if (r?.error) toast.error(r.error);
      else setCategorias(prev => prev.filter(c => c.id !== id));
    });
  }

  function handleSeed() {
    if (!confirm("Isso criará as categorias padrão (Peças, Mecânica, Vendas, etc.) para sua loja. Continuar?")) return;
    startTransition(async () => {
      await seedCategoriasPadraoAction();
      toast.success("Categorias padrão criadas!");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      {/* Nova categoria */}
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleCriar} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label>Nova categoria</Label>
              <Input placeholder="Nome da categoria" value={novoNome} onChange={e => setNovoNome(e.target.value)} required disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button type="button" variant={novoTipo === "ENTRADA" ? "default" : "outline"} size="sm"
                  onClick={() => { setNovoTipo("ENTRADA"); setNovaCor("#4ade80"); }}
                  className={novoTipo === "ENTRADA" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                  <ArrowDownLeft className="mr-1 h-4 w-4" />Receita
                </Button>
                <Button type="button" variant={novoTipo === "SAIDA" ? "default" : "outline"} size="sm"
                  onClick={() => { setNovoTipo("SAIDA"); setNovaCor("#f87171"); }}
                  className={novoTipo === "SAIDA" ? "bg-red-600 hover:bg-red-700" : ""}>
                  <ArrowUpRight className="mr-1 h-4 w-4" />Despesa
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={novaCor} onChange={e => setNovaCor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border p-0.5" />
                <span className="font-mono text-xs text-muted-foreground">{novaCor}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending || !novoNome.trim()}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar
              </Button>
              {categorias.length === 0 && (
                <Button type="button" variant="outline" onClick={handleSeed} disabled={isPending}>
                  <Wand2 className="mr-2 h-4 w-4" />Usar padrões
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {categorias.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p>Nenhuma categoria cadastrada.</p>
          <p className="mt-1">Crie sua primeira categoria ou use o botão <strong>"Usar padrões"</strong> para importar categorias típicas de concessionárias.</p>
        </div>
      )}

      {/* Receitas */}
      {receitas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Receitas</h2>
            <Badge variant="secondary" className="text-xs">{receitas.length}</Badge>
          </div>
          {receitas.map(c => <CategoriaCard key={c.id} cat={c} onDelete={handleExcluir} />)}
        </div>
      )}

      {/* Despesas */}
      {despesas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Despesas</h2>
            <Badge variant="secondary" className="text-xs">{despesas.length}</Badge>
          </div>
          {despesas.map(c => <CategoriaCard key={c.id} cat={c} onDelete={handleExcluir} />)}
        </div>
      )}
    </div>
  );
}
