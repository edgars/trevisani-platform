"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Car, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  CATALOGO_VEICULOS,
  getMarcas,
  getModelos,
  getAnosFabricacao,
  getAnosModelo,
  CORES_COMUNS,
  CATEGORIAS_VEICULO,
  type TipoVeiculo,
} from "@/lib/data/veiculos-brasil";
import { criarVeiculoAction } from "../actions";

interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
}

interface Props {
  slug: string;
  fornecedores: Fornecedor[];
}

export function VeiculoForm({ slug, fornecedores }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ─── Cascading state
  const [tipo, setTipo] = useState<TipoVeiculo>("carros");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  const marcas = useMemo(() => getMarcas(tipo), [tipo]);
  const modelos = useMemo(() => (marca ? getModelos(tipo, marca) : []), [tipo, marca]);
  const anosFab = useMemo(() => getAnosFabricacao(), []);
  const anosModelo = useMemo(() => getAnosModelo(), []);

  // ─── Price formatting
  const [precoCusto, setPrecoCusto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");

  function formatBRL(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Submit
  const action = criarVeiculoAction.bind(null, slug, null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // inject computed fields
    formData.set("tipo", tipo);
    formData.set("marca", marca);
    formData.set("modelo", modelo);
    formData.set("precoCusto", precoCusto);
    formData.set("precoVenda", precoVenda);

    startTransition(async () => {
      try {
        await criarVeiculoAction(slug, null, formData);
        toast.success("Veículo cadastrado com sucesso!");
        router.push(`/t/${slug}/veiculos`);
      } catch (err: any) {
        // redirect throws — ignore; genuine errors show toast
        if (err?.digest?.startsWith("NEXT_REDIRECT")) return;
        toast.error(err?.message ?? "Erro ao cadastrar veículo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── 1. Identificação ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" /> Identificação do veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v as TipoVeiculo);
                setMarca("");
                setModelo("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carros">Carro de passeio</SelectItem>
                <SelectItem value="motos">Motocicleta</SelectItem>
                <SelectItem value="caminhoes">Caminhão / Utilitário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marca */}
          <div className="space-y-1.5">
            <Label>Marca *</Label>
            <Select
              value={marca}
              onValueChange={(v) => {
                setMarca(v);
                setModelo("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {marcas.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modelo */}
          <div className="space-y-1.5">
            <Label>Modelo *</Label>
            <Select
              value={modelo}
              onValueChange={setModelo}
              disabled={!marca}
            >
              <SelectTrigger>
                <SelectValue placeholder={marca ? "Selecione o modelo" : "Selecione a marca primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Versão */}
          <div className="space-y-1.5">
            <Label htmlFor="versao">Versão / Trim</Label>
            <Input id="versao" name="versao" placeholder="Ex: 1.4 TSI Highline" />
          </div>

          {/* Ano Fabricação */}
          <div className="space-y-1.5">
            <Label>Ano de fabricação *</Label>
            <Select name="anoFabricacao" required>
              <SelectTrigger>
                <SelectValue placeholder="Ano fab." />
              </SelectTrigger>
              <SelectContent>
                {anosFab.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano Modelo */}
          <div className="space-y-1.5">
            <Label>Ano do modelo *</Label>
            <Select name="anoModelo" required>
              <SelectTrigger>
                <SelectValue placeholder="Ano modelo" />
              </SelectTrigger>
              <SelectContent>
                {anosModelo.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Características ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Características</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cor */}
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <Select name="cor">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cor" />
              </SelectTrigger>
              <SelectContent>
                {CORES_COMUNS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select name="categoria">
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_VEICULO.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Combustível */}
          <div className="space-y-1.5">
            <Label>Combustível</Label>
            <Select name="combustivel">
              <SelectTrigger>
                <SelectValue placeholder="Combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLEX">Flex</SelectItem>
                <SelectItem value="GASOLINA">Gasolina</SelectItem>
                <SelectItem value="ETANOL">Etanol</SelectItem>
                <SelectItem value="DIESEL">Diesel</SelectItem>
                <SelectItem value="GNV">GNV</SelectItem>
                <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                <SelectItem value="ELETRICO">Elétrico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Câmbio */}
          <div className="space-y-1.5">
            <Label>Câmbio</Label>
            <Select name="cambio">
              <SelectTrigger>
                <SelectValue placeholder="Câmbio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="AUTOMATICO">Automático</SelectItem>
                <SelectItem value="AUTOMATIZADO">Automatizado (AMT)</SelectItem>
                <SelectItem value="CVT">CVT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KM */}
          <div className="space-y-1.5">
            <Label htmlFor="kmAtual">Quilometragem</Label>
            <Input
              id="kmAtual"
              name="kmAtual"
              type="number"
              min={0}
              placeholder="Ex: 45000"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Documentação ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              name="placa"
              placeholder="ABC-1D23"
              className="uppercase"
              maxLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="renavam">RENAVAM</Label>
            <Input
              id="renavam"
              name="renavam"
              placeholder="00000000000"
              maxLength={11}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chassi">Chassi (VIN)</Label>
            <Input
              id="chassi"
              name="chassi"
              placeholder="9BWZZZ377VT004251"
              maxLength={17}
              className="uppercase"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="situacaoDocumental">Situação documental</Label>
            <Input
              id="situacaoDocumental"
              name="situacaoDocumental"
              placeholder="Ex: Regular, Débitos de IPVA, Restrição financeira..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Operacional / Financeiro ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operacional &amp; Precificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Origem */}
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select name="origem" defaultValue="COMPRA">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPRA">Compra</SelectItem>
                <SelectItem value="CONSIGNACAO">Consignação</SelectItem>
                <SelectItem value="TROCA">Troca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fornecedor */}
          {fornecedores.length > 0 && (
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Select name="fornecedorId">
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preço custo */}
          <div className="space-y-1.5">
            <Label htmlFor="precoCusto">Preço de custo (R$)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="precoCusto"
                name="precoCusto"
                className="pl-9"
                placeholder="0,00"
                value={precoCusto}
                onChange={(e) => setPrecoCusto(formatBRL(e.target.value))}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Preço venda */}
          <div className="space-y-1.5">
            <Label htmlFor="precoVenda">Preço de venda (R$)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="precoVenda"
                name="precoVenda"
                className="pl-9"
                placeholder="0,00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(formatBRL(e.target.value))}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              placeholder="Informações adicionais sobre o veículo..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/t/${slug}/veiculos`)}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !marca || !modelo}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cadastrar veículo
        </Button>
      </div>
    </form>
  );
}
