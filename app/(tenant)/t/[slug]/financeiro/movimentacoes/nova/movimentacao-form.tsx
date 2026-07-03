"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, Paperclip, Trash2, Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { criarMovimentacaoAction, atualizarMovimentacaoAction, uploadAnexoMovimentacaoAction, excluirAnexoAction } from "../actions";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MovContextData {
  categorias: { id: string; nome: string; tipo: "ENTRADA" | "SAIDA"; cor: string | null;
    itens: { id: string; nome: string }[] }[];
  contas:     { id: string; nome: string; banco: string }[];
  clientes:   { id: string; nome: string }[];
  fornecedores:{ id: string; nome: string }[];
  veiculos:   { id: string; label: string }[];
}

export interface MovData {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  descricao: string;
  valorCentavos: number;
  dataCompetencia: string; // ISO date string
  dataVencimento:  string | null;
  dataPagamento:   string | null;
  formaPagamento:  string | null;
  categoriaId:     string | null;
  itemId:          string | null;
  contaBancariaId: string | null;
  clienteId:       string | null;
  fornecedorId:    string | null;
  veiculoId:       string | null;
  observacoes:     string | null;
  anexos: { id: string; nome: string; url: string; mimeType: string }[];
}

interface Props {
  slug: string;
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
  { value: "PIX",           label: "PIX" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "DINHEIRO",      label: "Dinheiro / Caixa" },
  { value: "BOLETO",        label: "Boleto" },
  { value: "CARTAO",        label: "Cartão" },
  { value: "FINANCIAMENTO", label: "Financiamento" },
  { value: "OUTRO",         label: "Outro" },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function MovimentacaoForm({ slug, ctx, mov, defaultTipo = "SAIDA" }: Props) {
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
  const [categoriaId, setCategoriaId] = React.useState(mov?.categoriaId ?? "");
  const [itemId, setItemId] = React.useState(mov?.itemId ?? "");
  const [contaId, setContaId] = React.useState(mov?.contaBancariaId ?? "");
  const [clienteId, setClienteId] = React.useState(mov?.clienteId ?? "");
  const [fornecedorId, setFornecedorId] = React.useState(mov?.fornecedorId ?? "");
  const [veiculoId, setVeiculoId] = React.useState(mov?.veiculoId ?? "");
  const [obs, setObs] = React.useState(mov?.observacoes ?? "");
  const [anexos, setAnexos] = React.useState(mov?.anexos ?? []);
  const [uploadingAnexo, setUploadingAnexo] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const categoriasFiltradas = ctx.categorias.filter(c => c.tipo === tipo);
  const categoriaSelecionada = ctx.categorias.find(c => c.id === categoriaId);
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
    if (dataPag)  fd.set("dataPagamento", dataPag);
    if (forma)    fd.set("formaPagamento", forma);
    fd.set("status", status);
    if (categoriaId) fd.set("categoriaId", categoriaId);
    if (itemId)      fd.set("itemId", itemId);
    if (contaId)     fd.set("contaBancariaId", contaId);
    if (clienteId)   fd.set("clienteId", clienteId);
    if (fornecedorId) fd.set("fornecedorId", fornecedorId);
    if (veiculoId)   fd.set("veiculoId", veiculoId);
    if (obs)         fd.set("observacoes", obs);

    startTransition(async () => {
      if (isEdicao) {
        const result = await atualizarMovimentacaoAction(slug, mov!.id, null, fd);
        if (result?.error) {
          setServerError(result.error);
          toast.error(result.error);
        } else {
          toast.success("Movimentação atualizada!");
        }
      } else {
        const result = await criarMovimentacaoAction(slug, null, fd);
        if (result?.error) {
          setServerError(result.error);
          toast.error(result.error);
        } else if (result?.id) {
          toast.success("Movimentação criada!");
          router.push(`/t/${slug}/financeiro/movimentacoes/${result.id}/editar`);
        }
      }
    });
  }

  async function handleUploadAnexo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !mov) return;
    const fd = new FormData();
    fd.append("arquivo", file);
    setUploadingAnexo(true);
    const { error, anexo } = await uploadAnexoMovimentacaoAction(slug, mov.id, fd);
    setUploadingAnexo(false);
    if (error) toast.error(error);
    else if (anexo) {
      setAnexos(prev => [...prev, { id: anexo.id, nome: anexo.nome, url: anexo.url, mimeType: file.type }]);
      toast.success("Comprovante anexado.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleExcluirAnexo(id: string) {
    if (!confirm("Excluir comprovante?")) return;
    const { error } = await excluirAnexoAction(slug, id);
    if (error) toast.error(error);
    else setAnexos(prev => prev.filter(a => a.id !== id));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* ── 1. Tipo ──────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button type="button"
          onClick={() => { setTipo("ENTRADA"); setCategoriaId(""); setItemId(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition-all
            ${isEntrada ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "border-border hover:border-emerald-300"}`}
        >
          <ArrowDownLeft className="h-5 w-5" />Recebimento / Receita
        </button>
        <button type="button"
          onClick={() => { setTipo("SAIDA"); setCategoriaId(""); setItemId(""); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition-all
            ${!isEntrada ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "border-border hover:border-red-300"}`}
        >
          <ArrowUpRight className="h-5 w-5" />Pagamento / Despesa
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
            <Input id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} required disabled={isPending} placeholder={isEntrada ? "Ex: Recebimento venda Honda Civic" : "Ex: Manutenção suspensão"} />
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
            <Select value={categoriaId} onValueChange={v => { setCategoriaId(v); setItemId(""); }} disabled={isPending}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Nenhuma —</SelectItem>
                {categoriasFiltradas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.cor && <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: c.cor }} />}
                      {c.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoriaSelecionada && categoriaSelecionada.itens.length > 0 && (
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Select value={itemId} onValueChange={setItemId} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Nenhum —</SelectItem>
                  {categoriaSelecionada.itens.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Vínculos ───────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Vínculos (opcional)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Veículo</Label>
            <Select value={veiculoId} onValueChange={setVeiculoId} disabled={isPending}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Nenhum —</SelectItem>
                {ctx.veiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{isEntrada ? "Cliente" : "Fornecedor / Cliente"}</Label>
            {isEntrada ? (
              <Select value={clienteId} onValueChange={setClienteId} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Nenhum —</SelectItem>
                  {ctx.clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Select value={fornecedorId} onValueChange={setFornecedorId} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Nenhum —</SelectItem>
                  {ctx.fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} disabled={isPending} placeholder="Notas internas..." />
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Comprovantes ───────────────────────────────────────── */}
      {isEdicao && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Paperclip className="h-4 w-4" />Comprovantes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {anexos.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-lg">{a.mimeType.startsWith("image") ? "🖼️" : "📄"}</span>
                <span className="flex-1 text-sm truncate">{a.nome}</span>
                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                  <a href={a.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleExcluirAnexo(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              {uploadingAnexo ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground/50" />}
              <p className="text-sm text-muted-foreground">Adicionar comprovante (PDF ou imagem)</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUploadAnexo} disabled={uploadingAnexo} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(`/t/${slug}/financeiro/movimentacoes`)} disabled={isPending}>Cancelar</Button>
        <Button type="submit" disabled={isPending || !descricao || !valorStr || !dataComp}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdicao ? "Salvar" : "Criar movimentação"}
        </Button>
      </div>
    </form>
  );
}
