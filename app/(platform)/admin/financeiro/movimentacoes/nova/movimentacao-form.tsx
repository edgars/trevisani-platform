"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Loader2, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { CATEGORIAS_PLATAFORMA } from "@/lib/data/categorias-plataforma";
import { criarMovimentacaoAction, atualizarMovimentacaoAction } from "../actions";

export interface MovContextData {
  contas: { id: string; nome: string; banco: string }[];
  emissores: { id: string; nome: string; tipo: string }[];
}

export interface MovData {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  descricao: string;
  categoria: string | null;
  valorCentavos: number;
  dataCompetencia: string; // ISO date string
  dataVencimento: string | null;
  dataPagamento: string | null;
  formaPagamento: string | null;
  contaBancariaId: string | null;
  emissorId: string | null;
  observacoes: string | null;
  recorrencia: { id: string; descricao: string } | null;
}

interface Props {
  ctx: MovContextData;
  mov?: MovData;
  defaultTipo?: "ENTRADA" | "SAIDA";
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function centavosToStr(c: number): string {
  return (c / 100).toFixed(2).replace(".", ",");
}

const FORMAS = [
  { value: "PIX", label: "PIX" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "DINHEIRO", label: "Dinheiro / Caixa" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CARTAO", label: "Cartão" },
  { value: "OUTRO", label: "Outro" },
];

export function MovimentacaoForm({ ctx, mov, defaultTipo = "SAIDA" }: Props) {
  const router = useRouter();
  const isEdicao = !!mov;
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState("");

  const [tipo, setTipo] = React.useState<"ENTRADA" | "SAIDA">(mov?.tipo ?? defaultTipo);
  const [status, setStatus] = React.useState(mov?.status ?? "PENDENTE");
  const [descricao, setDescricao] = React.useState(mov?.descricao ?? "");
  const [valorStr, setValorStr] = React.useState(mov ? centavosToStr(mov.valorCentavos) : "");
  const [dataComp, setDataComp] = React.useState(mov ? toDateInput(mov.dataCompetencia) : toDateInput(new Date().toISOString()));
  const [dataVenc, setDataVenc] = React.useState(toDateInput(mov?.dataVencimento ?? null));
  const [dataPag, setDataPag] = React.useState(toDateInput(mov?.dataPagamento ?? null));
  const [forma, setForma] = React.useState(mov?.formaPagamento ?? "");
  const [categoria, setCategoria] = React.useState(mov?.categoria ?? "");
  const [contaId, setContaId] = React.useState(mov?.contaBancariaId ?? "");
  const [emissorId, setEmissorId] = React.useState(mov?.emissorId ?? "");
  const [obs, setObs] = React.useState(mov?.observacoes ?? "");

  const categoriasFiltradas = CATEGORIAS_PLATAFORMA.filter(c => c.tipo === tipo);
  const isEntrada = tipo === "ENTRADA";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const fd = new FormData();
    fd.set("tipo", tipo);
    fd.set("descricao", descricao);
    fd.set("valorStr", valorStr);
    fd.set("dataCompetencia", dataComp);
    if (dataVenc) fd.set("dataVencimento", dataVenc);
    if (dataPag) fd.set("dataPagamento", dataPag);
    if (forma) fd.set("formaPagamento", forma);
    fd.set("status", status);
    if (categoria) fd.set("categoria", categoria);
    if (contaId) fd.set("contaBancariaId", contaId);
    if (emissorId) fd.set("emissorId", emissorId);
    if (obs) fd.set("observacoes", obs);

    startTransition(async () => {
      if (isEdicao) {
        const result = await atualizarMovimentacaoAction(mov!.id, null, fd);
        if (result?.error) {
          setServerError(result.error);
          toast.error(result.error);
        } else {
          toast.success("Movimentação atualizada!");
        }
      } else {
        const result = await criarMovimentacaoAction(null, fd);
        if (result?.error) {
          setServerError(result.error);
          toast.error(result.error);
        } else if (result?.id) {
          toast.success("Movimentação criada!");
          router.push(`/admin/financeiro/movimentacoes/${result.id}/editar`);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {mov?.recorrencia && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
          <Repeat className="h-4 w-4 shrink-0" />
          <span>
            Gerada automaticamente pela recorrência <strong>{mov.recorrencia.descricao}</strong>. O valor abaixo é só
            deste mês — outros meses não são afetados.{" "}
            <Link href="/admin/financeiro/recorrencias" className="underline underline-offset-2">Gerenciar recorrências</Link>
          </span>
        </div>
      )}

      {/* ── 1. Tipo ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button type="button"
          onClick={() => { setTipo("ENTRADA"); setCategoria(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition-all
            ${isEntrada ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "border-border hover:border-emerald-300"}`}
        >
          <ArrowDownLeft className="h-5 w-5" />Entrada / Crédito
        </button>
        <button type="button"
          onClick={() => { setTipo("SAIDA"); setCategoria(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition-all
            ${!isEntrada ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "border-border hover:border-red-300"}`}
        >
          <ArrowUpRight className="h-5 w-5" />Saída / Débito
        </button>
      </div>

      {/* ── 2. Dados principais ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da movimentação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} required disabled={isPending} placeholder={isEntrada ? "Ex: Setup Loja XYZ" : "Ex: Hospedagem mensal"} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input id="valor" value={valorStr} onChange={e => setValorStr(e.target.value)}
              placeholder="0,00" required disabled={isPending}
              className={isEntrada ? "border-emerald-300 focus-visible:ring-emerald-400" : "border-red-300 focus-visible:ring-red-400"} />
          </div>

          <div className="space-y-1.5">
            <Label>Data da competência *</Label>
            <Input type="date" value={dataComp} onChange={e => setDataComp(e.target.value)} required disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label>Data de vencimento</Label>
            <Input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label>Data de pagamento</Label>
            <Input type="date" value={dataPag} onChange={e => setDataPag(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as "PENDENTE" | "PAGO" | "CANCELADO")} disabled={isPending}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO">Liquidado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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
        </CardContent>
      </Card>

      {/* ── 3. Classificação ──────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Classificação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input
              list="categorias-plataforma"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="Selecione ou digite uma categoria"
              disabled={isPending}
            />
            <datalist id="categorias-plataforma">
              {categoriasFiltradas.map(c => <option key={c.nome} value={c.nome} />)}
            </datalist>
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

          <div className="space-y-1.5 sm:col-span-3">
            <Label>Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} disabled={isPending} placeholder="Notas internas..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/financeiro/movimentacoes")} disabled={isPending}>Cancelar</Button>
        <Button type="submit" disabled={isPending || !descricao || !valorStr || !dataComp}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdicao ? "Salvar" : "Criar movimentação"}
        </Button>
      </div>
    </form>
  );
}
