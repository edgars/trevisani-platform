"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Loader2, Pencil, Plus, Repeat, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

import { CATEGORIAS_PLATAFORMA } from "@/lib/data/categorias-plataforma";
import { formatCentavos } from "@/lib/utils";
import {
  criarRecorrenciaAction,
  atualizarRecorrenciaAction,
  cancelarRecorrenciaAction,
  reativarRecorrenciaAction,
  excluirRecorrenciaAction,
} from "./actions";

export interface RecorrenciaCtx {
  contas: { id: string; nome: string; banco: string }[];
  emissores: { id: string; nome: string; tipo: string }[];
}

export interface RecorrenciaData {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  categoria: string | null;
  valorPadraoCentavos: number;
  diaVencimento: number;
  formaPagamento: string | null;
  contaBancariaId: string | null;
  emissorId: string | null;
  observacoes: string | null;
  ativa: boolean;
  dataInicio: string; // ISO
  dataFim: string | null;
  totalGeradas: number;
}

const FORMAS = [
  { value: "PIX", label: "PIX" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "DINHEIRO", label: "Dinheiro / Caixa" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARTAO", label: "Cartão" },
  { value: "OUTRO", label: "Outro" },
];

function centavosToStr(c: number): string {
  return (c / 100).toFixed(2).replace(".", ",");
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function RecorrenciaForm({
  ctx,
  recorrencia,
  onClose,
}: {
  ctx: RecorrenciaCtx;
  recorrencia?: RecorrenciaData;
  onClose: () => void;
}) {
  const isEdicao = !!recorrencia;
  const [isPending, startTransition] = React.useTransition();
  const [tipo, setTipo] = React.useState<"ENTRADA" | "SAIDA">(recorrencia?.tipo ?? "SAIDA");
  const [categoria, setCategoria] = React.useState(recorrencia?.categoria ?? "");
  const [forma, setForma] = React.useState(recorrencia?.formaPagamento ?? "");
  const [contaId, setContaId] = React.useState(recorrencia?.contaBancariaId ?? "");
  const [emissorId, setEmissorId] = React.useState(recorrencia?.emissorId ?? "");

  const categoriasFiltradas = CATEGORIAS_PLATAFORMA.filter(c => c.tipo === tipo);
  const isEntrada = tipo === "ENTRADA";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    if (categoria) fd.set("categoria", categoria); else fd.delete("categoria");
    if (forma) fd.set("formaPagamento", forma); else fd.delete("formaPagamento");
    if (contaId) fd.set("contaBancariaId", contaId); else fd.delete("contaBancariaId");
    if (emissorId) fd.set("emissorId", emissorId); else fd.delete("emissorId");

    startTransition(async () => {
      const result = isEdicao
        ? await atualizarRecorrenciaAction(recorrencia!.id, null, fd)
        : await criarRecorrenciaAction(null, fd);
      if (result?.error) toast.error(result.error);
      else { toast.success(isEdicao ? "Recorrência atualizada!" : "Recorrência criada!"); onClose(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="flex gap-3">
        <button type="button" onClick={() => { setTipo("ENTRADA"); setCategoria(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all
            ${isEntrada ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "border-border hover:border-emerald-300"}`}
        >
          <ArrowDownLeft className="h-4 w-4" />Entrada
        </button>
        <button type="button" onClick={() => { setTipo("SAIDA"); setCategoria(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all
            ${!isEntrada ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "border-border hover:border-red-300"}`}
        >
          <ArrowUpRight className="h-4 w-4" />Saída
        </button>
      </div>

      <div className="space-y-1.5">
        <Label>Descrição *</Label>
        <Input name="descricao" defaultValue={recorrencia?.descricao} placeholder="Ex: Hospedagem Vercel, Pró-labore sócio" required disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Valor padrão (R$) *</Label>
          <Input name="valorStr" defaultValue={recorrencia ? centavosToStr(recorrencia.valorPadraoCentavos) : ""} placeholder="0,00" required disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label>Dia de vencimento *</Label>
          <Input type="number" name="diaVencimento" min={1} max={28} defaultValue={recorrencia?.diaVencimento ?? 5} required disabled={isPending} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Input list="categorias-recorrencia" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Selecione ou digite" disabled={isPending} />
          <datalist id="categorias-recorrencia">
            {categoriasFiltradas.map(c => <option key={c.nome} value={c.nome} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select value={forma} onValueChange={setForma} disabled={isPending}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhuma —</SelectItem>
              {FORMAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Conta bancária</Label>
          <Select value={contaId} onValueChange={setContaId} disabled={isPending}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhuma —</SelectItem>
              {ctx.contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} — {c.banco}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fornecedor / Emissor</Label>
          <Select value={emissorId} onValueChange={setEmissorId} disabled={isPending}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Nenhum —</SelectItem>
              {ctx.emissores.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Início da recorrência *</Label>
        <Input type="date" name="dataInicio" defaultValue={recorrencia ? toDateInput(recorrencia.dataInicio) : toDateInput(new Date().toISOString())} required disabled={isPending || isEdicao} />
        {isEdicao && <p className="text-xs text-muted-foreground">O início não pode ser alterado após a criação.</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea name="observacoes" defaultValue={recorrencia?.observacoes ?? ""} rows={2} disabled={isPending} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdicao ? "Salvar" : "Criar recorrência"}
        </Button>
      </div>
    </form>
  );
}

export function RecorrenciasManager({ ctx, recorrencias: initial }: { ctx: RecorrenciaCtx; recorrencias: RecorrenciaData[] }) {
  const [recorrencias, setRecorrencias] = React.useState(initial);
  const [editando, setEditando] = React.useState<RecorrenciaData | null>(null);
  const [criarAberto, setCriarAberto] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function reload() { window.location.reload(); }

  function handleCancelar(id: string) {
    if (!confirm("Cancelar esta recorrência? Os meses já gerados são mantidos, mas nenhum novo mês será criado.")) return;
    startTransition(async () => {
      const { error } = await cancelarRecorrenciaAction(id);
      if (error) toast.error(error);
      else { toast.success("Recorrência cancelada."); reload(); }
    });
  }

  function handleReativar(id: string) {
    startTransition(async () => {
      const { error } = await reativarRecorrenciaAction(id);
      if (error) toast.error(error);
      else { toast.success("Recorrência reativada."); reload(); }
    });
  }

  function handleExcluir(id: string) {
    if (!confirm("Excluir esta recorrência? Esta ação é irreversível.")) return;
    startTransition(async () => {
      const { error } = await excluirRecorrenciaAction(id);
      if (error) toast.error(error);
      else setRecorrencias(r => r.filter(x => x.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={criarAberto} onOpenChange={setCriarAberto}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova recorrência</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova despesa/receita recorrente</DialogTitle></DialogHeader>
            <RecorrenciaForm ctx={ctx} onClose={() => { setCriarAberto(false); reload(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {recorrencias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Repeat className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhuma recorrência cadastrada. Crie despesas ou receitas mensais que se repetem automaticamente todo mês.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recorrencias.map(r => {
            const isEntrada = r.tipo === "ENTRADA";
            return (
              <Card key={r.id} className={r.ativa ? "" : "opacity-60"}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isEntrada
                          ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-500" />
                          : <ArrowUpRight className="h-4 w-4 shrink-0 text-red-500" />}
                        <p className="truncate font-semibold">{r.descricao}</p>
                      </div>
                      <p className={`mt-1 text-sm font-semibold tabular-nums ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatCentavos(r.valorPadraoCentavos)}/mês
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />Todo dia {r.diaVencimento}
                      </p>
                      {r.categoria && <p className="text-xs text-muted-foreground">{r.categoria}</p>}
                    </div>
                    <Badge variant={r.ativa ? "secondary" : "outline"} className={`text-[10px] shrink-0 ${r.ativa ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}>
                      {r.ativa ? "Ativa" : "Cancelada"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{r.totalGeradas} mês(es) gerado(s)</p>
                  <div className="mt-3 flex gap-1">
                    <Dialog open={editando?.id === r.id} onOpenChange={(open) => !open && setEditando(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 flex-1" onClick={() => setEditando(r)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Editar recorrência</DialogTitle></DialogHeader>
                        {editando?.id === r.id && (
                          <RecorrenciaForm ctx={ctx} recorrencia={editando} onClose={() => { setEditando(null); reload(); }} />
                        )}
                      </DialogContent>
                    </Dialog>
                    {r.ativa ? (
                      <Button variant="ghost" size="sm" className="h-7 text-amber-600 hover:text-amber-600" onClick={() => handleCancelar(r.id)} disabled={isPending}>
                        Cancelar
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-emerald-600 hover:text-emerald-600" onClick={() => handleReativar(r.id)} disabled={isPending}>
                        Reativar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={() => handleExcluir(r.id)}
                      disabled={isPending || r.totalGeradas > 0}
                      title={r.totalGeradas > 0 ? "Cancele em vez de excluir — já há meses gerados" : "Excluir"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
