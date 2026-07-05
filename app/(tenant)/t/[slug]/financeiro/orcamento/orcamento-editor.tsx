"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salvarOrcamentoAction, type LinhaOrcamento } from "./actions";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Categoria { id: string; nome: string; tipo: "ENTRADA" | "SAIDA"; }

interface Props {
  ano: number; mes: number;
  receitas: LinhaOrcamento[];
  despesas: LinhaOrcamento[];
  categorias: Categoria[];
  aliquotaBase: number;
  overheadBase: number;
  aliquotaOverride: number | null;
  overheadOverride: number | null;
  observacoes: string;
}

let _id = 0;
function uid() { return `r${++_id}`; }

function parseMoeda(s: string): number {
  return Math.round(parseFloat((s || "0").replace(/\./g, "").replace(",", ".")) * 100) || 0;
}
function formatMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatInput(centavos: number): string {
  return centavos === 0 ? "" : (centavos / 100).toFixed(2).replace(".", ",");
}

function LinhaEditor({
  linha, categorias, tipo, onChange, onRemove,
}: {
  linha: LinhaOrcamento & { _inputVal?: string };
  categorias: Categoria[];
  tipo: "ENTRADA" | "SAIDA";
  onChange: (l: LinhaOrcamento & { _inputVal?: string }) => void;
  onRemove: () => void;
}) {
  const cats = categorias.filter(c => c.tipo === tipo);
  return (
    <div className="flex flex-wrap items-center gap-2 md:grid md:grid-cols-[1fr_auto_auto_auto]">
      <Input
        placeholder="Descrição"
        value={linha.descricao}
        onChange={e => onChange({ ...linha, descricao: e.target.value })}
        className="h-8 text-sm"
      />
      <Select
        value={linha.categoriaId ?? ""}
        onValueChange={v => onChange({ ...linha, categoriaId: v || null })}
      >
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Sem categoria</SelectItem>
          {cats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <Input
          className="h-8 w-28 pl-7 text-right text-sm tabular-nums"
          placeholder="0,00"
          value={linha._inputVal ?? formatInput(linha.valorCentavos)}
          onChange={e => {
            const raw = e.target.value;
            onChange({ ...linha, _inputVal: raw, valorCentavos: parseMoeda(raw) });
          }}
          onBlur={e => {
            const c = parseMoeda(e.target.value);
            onChange({ ...linha, _inputVal: undefined, valorCentavos: c });
          }}
        />
      </div>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DRELine({
  label, value, indent = 0, bold = false, highlight, sub,
}: { label: string; value: number; indent?: number; bold?: boolean; highlight?: "green" | "red" | "neutral"; sub?: string }) {
  const color = highlight === "green" ? "text-emerald-600 dark:text-emerald-400"
    : highlight === "red" ? "text-red-600 dark:text-red-400"
    : "";
  return (
    <div className={`flex items-baseline justify-between gap-2 py-1.5 ${indent > 0 ? `pl-${indent * 4}` : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"} ${color}`}>
        {label}
        {sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>}
      </span>
      <span className={`tabular-nums text-sm ${bold ? "font-semibold" : ""} ${color}`}>{formatMoeda(value)}</span>
    </div>
  );
}

export function OrcamentoEditor({
  ano, mes, receitas: initReceitas, despesas: initDespesas, categorias,
  aliquotaBase, overheadBase, aliquotaOverride, overheadOverride, observacoes: initObs,
}: Props) {
  const router = useRouter();
  type Linha = LinhaOrcamento & { _inputVal?: string };

  const [receitas, setReceitas] = React.useState<Linha[]>(
    initReceitas.length ? initReceitas : [{ id: uid(), descricao: "", categoriaId: null, valorCentavos: 0 }]
  );
  const [despesas, setDespesas] = React.useState<Linha[]>(
    initDespesas.length ? initDespesas : [{ id: uid(), descricao: "", categoriaId: null, valorCentavos: 0 }]
  );
  const [useOverrideAliq, setUseOverrideAliq] = React.useState(aliquotaOverride !== null);
  const [aliqOverride, setAliqOverride]       = React.useState(String(aliquotaOverride ?? aliquotaBase));
  const [useOverrideOh, setUseOverrideOh]     = React.useState(overheadOverride !== null);
  const [ohOverrideStr, setOhOverrideStr]     = React.useState(
    overheadOverride !== null ? formatInput(overheadOverride) : formatInput(overheadBase)
  );
  const [observacoes, setObservacoes]         = React.useState(initObs);
  const [isPending, startTransition]          = React.useTransition();

  // ── Live DRE calc ────────────────────────────────────────────────────────
  const totalReceitas = receitas.reduce((s, l) => s + (l.valorCentavos || 0), 0);
  const aliquota      = useOverrideAliq ? parseFloat(aliqOverride) || 0 : aliquotaBase;
  const impostos      = Math.round(totalReceitas * aliquota / 100);
  const receitaLiq    = totalReceitas - impostos;
  const totalDespesas = despesas.reduce((s, l) => s + (l.valorCentavos || 0), 0);
  const overhead      = useOverrideOh ? parseMoeda(ohOverrideStr) : overheadBase;
  const resultado     = receitaLiq - totalDespesas - overhead;

  function navMonth(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    router.push(`?ano=${a}&mes=${m}`);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await salvarOrcamentoAction({
        ano, mes,
        receitas: receitas.map(({ _inputVal: _iv, ...r }) => r),
        despesas: despesas.map(({ _inputVal: _iv, ...d }) => d),
        aliquotaOverridesPct:     useOverrideAliq ? parseFloat(aliqOverride) || null : null,
        overheadOverrideCentavos: useOverrideOh   ? parseMoeda(ohOverrideStr) : null,
        observacoes,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Orçamento salvo!");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* LEFT: editor */}
      <div className="space-y-4">
        {/* Month nav */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-semibold">
            {MESES[mes - 1]} / {ano}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Receitas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-600" />Receitas esperadas
              </CardTitle>
              <Badge variant="secondary" className="tabular-nums">{formatMoeda(totalReceitas)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {receitas.map((l, i) => (
              <LinhaEditor
                key={l.id} linha={l} categorias={categorias} tipo="ENTRADA"
                onChange={nl => setReceitas(r => r.map((x, j) => j === i ? nl : x))}
                onRemove={() => setReceitas(r => r.filter((_, j) => j !== i))}
              />
            ))}
            <Button
              type="button" variant="ghost" size="sm"
              className="mt-1 h-7 text-xs text-muted-foreground"
              onClick={() => setReceitas(r => [...r, { id: uid(), descricao: "", categoriaId: null, valorCentavos: 0 }])}
            >
              <Plus className="mr-1 h-3 w-3" />Adicionar linha
            </Button>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-red-500" />Despesas esperadas
              </CardTitle>
              <Badge variant="secondary" className="tabular-nums">{formatMoeda(totalDespesas)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {despesas.map((l, i) => (
              <LinhaEditor
                key={l.id} linha={l} categorias={categorias} tipo="SAIDA"
                onChange={nl => setDespesas(d => d.map((x, j) => j === i ? nl : x))}
                onRemove={() => setDespesas(d => d.filter((_, j) => j !== i))}
              />
            ))}
            <Button
              type="button" variant="ghost" size="sm"
              className="mt-1 h-7 text-xs text-muted-foreground"
              onClick={() => setDespesas(d => [...d, { id: uid(), descricao: "", categoriaId: null, valorCentavos: 0 }])}
            >
              <Plus className="mr-1 h-3 w-3" />Adicionar linha
            </Button>
          </CardContent>
        </Card>

        {/* Fiscal overrides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-amber-500" />Ajustes fiscais para este mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox" id="chkAliq"
                checked={useOverrideAliq}
                onChange={e => setUseOverrideAliq(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border"
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="chkAliq" className="cursor-pointer text-sm">
                  Sobrescrever alíquota de impostos para este mês
                </Label>
                {useOverrideAliq && (
                  <div className="relative max-w-xs">
                    <Input
                      type="number" step="0.01" min="0" max="100"
                      value={aliqOverride} onChange={e => setAliqOverride(e.target.value)}
                      className="h-8 pr-8 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                )}
                {!useOverrideAliq && (
                  <p className="text-xs text-muted-foreground">Usando padrão: {aliquotaBase}%</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox" id="chkOh"
                checked={useOverrideOh}
                onChange={e => setUseOverrideOh(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border"
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="chkOh" className="cursor-pointer text-sm">
                  Sobrescrever overhead fixo para este mês
                </Label>
                {useOverrideOh && (
                  <div className="relative max-w-xs">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input
                      className="h-8 pl-7 text-sm"
                      value={ohOverrideStr} onChange={e => setOhOverrideStr(e.target.value)}
                    />
                  </div>
                )}
                {!useOverrideOh && (
                  <p className="text-xs text-muted-foreground">
                    Usando padrão: {formatMoeda(overheadBase)}/mês
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea
            rows={2} placeholder="Notas sobre premissas deste orçamento..."
            value={observacoes} onChange={e => setObservacoes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={handleSave} disabled={isPending} className="min-w-36">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar orçamento
          </Button>
        </div>
      </div>

      {/* RIGHT: live DRE preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          DRE Planejado · {MESES[mes - 1]}/{ano}
        </h3>
        <Card>
          <CardContent className="pt-4">
            <div className="divide-y">
              <DRELine label="(+) Receita Bruta"        value={totalReceitas}       bold />
              <DRELine label="(−) Impostos"              value={-impostos}           indent={1}
                sub={`${aliquota.toFixed(1)}%`} />
              <DRELine label="= Receita Líquida"         value={receitaLiq}          bold
                highlight={receitaLiq >= 0 ? "green" : "red"} />
              <div className="py-1" />
              <DRELine label="(−) Despesas Operacionais" value={-totalDespesas}      bold />
              {despesas.filter(d => d.descricao).map(d => (
                <DRELine key={d.id} label={d.descricao} value={-d.valorCentavos} indent={1} />
              ))}
              <DRELine label="(−) Overhead Fixo"         value={-overhead}           indent={1}
                sub="fixo/mês" />
              <div className="py-1" />
              <DRELine
                label="= Resultado do Período"
                value={resultado}
                bold
                highlight={resultado >= 0 ? "green" : "red"}
              />
              {resultado < 0 && (
                <div className="flex items-center gap-2 py-2 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Orçamento deficitário neste mês
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p>Margem Bruta</p>
            <p className={`text-base font-semibold ${receitaLiq > 0 ? "text-foreground" : "text-red-600"}`}>
              {totalReceitas > 0 ? ((receitaLiq / totalReceitas) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p>Margem Líquida</p>
            <p className={`text-base font-semibold ${resultado >= 0 ? "text-foreground" : "text-red-600"}`}>
              {totalReceitas > 0 ? ((resultado / totalReceitas) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
