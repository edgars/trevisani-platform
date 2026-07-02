"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Car, Loader2, Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCentavos, parseCentavos } from "@/lib/utils";
import { criarCompraAction } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FornecedorOpt {
  id: string;
  nome: string;
  razaoSocial?: string | null;
  documento: string;
}

export interface VeiculoOpt {
  id: string;
  marca: string;
  modelo: string;
  versao?: string | null;
  placa?: string | null;
  anoFabricacao: number;
  anoModelo: number;
  precoCustoCentavos: number;
  fornecedorId?: string | null;
  thumbUrl?: string | null;
}

interface ItemSelecionado {
  veiculo: VeiculoOpt;
  valorCentavos: number;
  valorStr: string;
}

// ─── Helper: formata preço ────────────────────────────────────────────────────

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function centavosParaBRL(centavos: number): string {
  if (!centavos) return "";
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CompraForm({
  slug,
  fornecedores,
  veiculos: todosVeiculos,
}: {
  slug: string;
  fornecedores: FornecedorOpt[];
  veiculos: VeiculoOpt[];
}) {
  const router = useRouter();
  const [fornecedorId, setFornecedorId] = React.useState<string>("");
  const [busca, setBusca] = React.useState("");
  const [itens, setItens] = React.useState<ItemSelecionado[]>([]);

  const action = criarCompraAction.bind(null, slug);
  const [state, formAction, isPending] = useActionState(action, null);

  React.useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  // Filtra veículos que já foram selecionados
  const selecionadosIds = new Set(itens.map((i) => i.veiculo.id));

  // Filtra por fornecedor (se selecionado, prioriza os do fornecedor mas mostra todos)
  const veiculosFiltrados = todosVeiculos.filter((v) => {
    if (selecionadosIds.has(v.id)) return false;
    const termo = busca.toLowerCase();
    if (termo) {
      return (
        v.marca.toLowerCase().includes(termo) ||
        v.modelo.toLowerCase().includes(termo) ||
        (v.placa ?? "").toLowerCase().includes(termo)
      );
    }
    return true;
  });

  // Ordena: veículos do fornecedor selecionado primeiro
  const veiculosOrdenados = [...veiculosFiltrados].sort((a, b) => {
    const aMatch = fornecedorId && a.fornecedorId === fornecedorId ? -1 : 0;
    const bMatch = fornecedorId && b.fornecedorId === fornecedorId ? -1 : 0;
    return aMatch - bMatch;
  });

  function adicionarVeiculo(v: VeiculoOpt) {
    setItens((prev) => [
      ...prev,
      {
        veiculo: v,
        valorCentavos: v.precoCustoCentavos,
        valorStr: centavosParaBRL(v.precoCustoCentavos),
      },
    ]);
  }

  function removerVeiculo(veiculoId: string) {
    setItens((prev) => prev.filter((i) => i.veiculo.id !== veiculoId));
  }

  function atualizarValor(veiculoId: string, valorStr: string) {
    const formatted = formatBRL(valorStr);
    setItens((prev) =>
      prev.map((i) =>
        i.veiculo.id === veiculoId
          ? { ...i, valorStr: formatted, valorCentavos: parseCentavos(formatted) }
          : i,
      ),
    );
  }

  const valorTotal = itens.reduce((s, i) => s + i.valorCentavos, 0);

  const itensJson = JSON.stringify(
    itens.map((i) => ({
      veiculoId: i.veiculo.id,
      valorCentavos: i.valorCentavos,
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="itensJson" value={itensJson} />

      {/* ── Cabeçalho da compra ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da compra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Fornecedor *</Label>
            <Select
              name="fornecedorId"
              value={fornecedorId}
              onValueChange={setFornecedorId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                    {f.razaoSocial && f.razaoSocial !== f.nome
                      ? ` — ${f.razaoSocial}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dataOperacao">Data da operação</Label>
            <Input
              id="dataOperacao"
              name="dataOperacao"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              name="observacoes"
              placeholder="Condições, referências do negócio..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Seleção de veículos ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Veículos adquiridos</CardTitle>
          {itens.length > 0 && (
            <span className="text-sm font-semibold">
              Total: {formatCentavos(valorTotal)}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Itens selecionados */}
          {itens.length > 0 && (
            <div className="divide-y rounded-xl border">
              {itens.map((item) => (
                <div key={item.veiculo.id} className="flex items-center gap-3 p-3">
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.veiculo.thumbUrl ? (
                      <Image
                        src={item.veiculo.thumbUrl}
                        alt={`${item.veiculo.marca} ${item.veiculo.modelo}`}
                        fill sizes="64px" className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.veiculo.marca} {item.veiculo.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.veiculo.anoFabricacao}/{item.veiculo.anoModelo}
                      {item.veiculo.placa ? ` · ${item.veiculo.placa}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      value={item.valorStr}
                      onChange={(e) => atualizarValor(item.veiculo.id, e.target.value)}
                      className="h-8 w-32 text-right text-sm"
                      inputMode="numeric"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removerVeiculo(item.veiculo.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Busca para adicionar veículos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar veículo por marca, modelo ou placa…"
                className="h-8"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border divide-y">
              {veiculosOrdenados.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {busca ? "Nenhum veículo encontrado." : "Todos os veículos disponíveis já foram adicionados."}
                </p>
              ) : (
                veiculosOrdenados.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => adicionarVeiculo(v)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {v.thumbUrl ? (
                        <Image
                          src={v.thumbUrl}
                          alt={`${v.marca} ${v.modelo}`}
                          fill sizes="56px" className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {v.marca} {v.modelo}
                        {v.versao ? ` ${v.versao}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.anoFabricacao}/{v.anoModelo}
                        {v.placa ? ` · ${v.placa}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fornecedorId && v.fornecedorId === fornecedorId && (
                        <Badge variant="outline" className="text-[10px]">
                          Deste fornecedor
                        </Badge>
                      )}
                      <span className="text-sm font-medium">
                        {formatCentavos(v.precoCustoCentavos)}
                      </span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Ações ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/t/${slug}/compras`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || itens.length === 0 || !fornecedorId} className="gap-2">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar compra
        </Button>
      </div>
    </form>
  );
}
