"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle,
  PencilLine,
  ShieldAlert,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge }    from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getMarcas,
  getModelos,
  getAnosFabricacao,
  getAnosModelo,
  CORES_COMUNS,
  CATEGORIAS_VEICULO,
  type TipoVeiculo,
} from "@/lib/data/veiculos-brasil";
import { criarVeiculoAction, atualizarVeiculoAction } from "../actions";
import { consultarPlacaAction } from "./placa-actions";
import { parseCentavos } from "@/lib/utils";
import type { PlacaDados } from "@/lib/integrations/placa/types";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
}

export interface VeiculoData {
  id: string;
  status?: string;
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  versao?: string | null;
  anoFabricacao: number;
  anoModelo: number;
  cor?: string | null;
  categoria?: string | null;
  combustivel?: string | null;
  cambio?: string | null;
  kmAtual?: number | null;
  placa?: string | null;
  renavam?: string | null;
  chassi?: string | null;
  situacaoDocumental?: string | null;
  origem: string;
  fornecedorId?: string | null;
  precoCustoCentavos: number;
  precoVendaCentavos: number;
  observacoes?: string | null;
  // ─ Novos campos técnicos ────────────────────────────────────────────────
  motor?: string | null;
  portas?: number | null;
  ufRegistro?: string | null;
  tipoCrv?: string | null;
  numeroCrv?: string | null;
  chassiRemarcado?: boolean;
  blindado?: boolean;
  leilao?: boolean;
  sinistro?: boolean;
  manualProprietario?: boolean;
  chaveReserva?: boolean;
  proprietarioNome?: string | null;
  proprietarioDoc?: string | null;
}

interface Props {
  slug: string;
  fornecedores: Fornecedor[];
  veiculo?: VeiculoData; // undefined = modo criar
}

type LookupStatus = "idle" | "loading" | "found" | "not_found" | "manual";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centavosParaBRL(centavos: number): string {
  if (!centavos) return "";
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarPlacaInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function VeiculoForm({ slug, fornecedores, veiculo }: Props) {
  const isEdicao = !!veiculo;
  const router   = useRouter();
  const [isPending, startTransition] = useTransition();
  const [limiteAtingido, setLimiteAtingido] = useState<string | null>(null);

  // ─ Estado de lookup de placa (apenas no modo criar) ─
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>(
    isEdicao ? "manual" : "idle",
  );
  const [isLookingUp, setIsLookingUp] = useState(false);

  // ─ Campos controlados ─────────────────────────────────────────────────────

  const [placa,  setPlaca]  = useState(veiculo?.placa  ?? "");
  const [tipo,   setTipo]   = useState<TipoVeiculo>(veiculo?.tipo ?? "carros");
  const [marca,  setMarca]  = useState(veiculo?.marca  ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [versao, setVersao] = useState(veiculo?.versao ?? "");
  const [anoFabricacao, setAnoFabricacao] = useState(String(veiculo?.anoFabricacao ?? ""));
  const [anoModelo,     setAnoModelo]     = useState(String(veiculo?.anoModelo ?? ""));
  const [cor,           setCor]           = useState(veiculo?.cor ?? "");
  const [combustivel,   setCombustivel]   = useState(veiculo?.combustivel ?? "");
  const [cambio,        setCambio]        = useState(veiculo?.cambio ?? "");
  const [kmAtual,       setKmAtual]       = useState(String(veiculo?.kmAtual ?? ""));
  const [categoria,     setCategoria]     = useState(veiculo?.categoria ?? "");
  const [renavam,       setRenavam]       = useState(veiculo?.renavam ?? "");
  const [chassi,        setChassi]        = useState(veiculo?.chassi ?? "");
  const [situacaoDocumental, setSituacaoDocumental] = useState(
    veiculo?.situacaoDocumental ?? "",
  );
  const [origem, setOrigem] = useState(veiculo?.origem ?? "COMPRA");
  const [fornecedorId, setFornecedorId] = useState(veiculo?.fornecedorId ?? "");
  const [precoCusto, setPrecoCusto] = useState(
    centavosParaBRL(veiculo?.precoCustoCentavos ?? 0),
  );
  const [precoVenda, setPrecoVenda] = useState(
    centavosParaBRL(veiculo?.precoVendaCentavos ?? 0),
  );
  const [observacoes, setObservacoes] = useState(veiculo?.observacoes ?? "");

  // ─ Campos técnicos ────────────────────────────────────────────────────────
  const [motor,       setMotor]       = useState(veiculo?.motor ?? "");
  const [portas,      setPortas]      = useState(String(veiculo?.portas ?? ""));
  const [ufRegistro,  setUfRegistro]  = useState(veiculo?.ufRegistro ?? "");
  const [tipoCrv,     setTipoCrv]     = useState(veiculo?.tipoCrv ?? "");
  const [numeroCrv,   setNumeroCrv]   = useState(veiculo?.numeroCrv ?? "");

  // ─ Condições booleanas ────────────────────────────────────────────────────
  const [chassiRemarcado,    setChassiRemarcado]    = useState(veiculo?.chassiRemarcado ?? false);
  const [blindado,           setBlindado]           = useState(veiculo?.blindado ?? false);
  const [leilao,             setLeilao]             = useState(veiculo?.leilao ?? false);
  const [sinistro,           setSinistro]           = useState(veiculo?.sinistro ?? false);
  const [manualProprietario, setManualProprietario] = useState(veiculo?.manualProprietario ?? false);
  const [chaveReserva,       setChaveReserva]       = useState(veiculo?.chaveReserva ?? false);

  // ─ Proprietário ──────────────────────────────────────────────────────────
  const [proprietarioNome, setProprietarioNome] = useState(veiculo?.proprietarioNome ?? "");
  const [proprietarioDoc,  setProprietarioDoc]  = useState(veiculo?.proprietarioDoc ?? "");

  // ─ Dados extras da API (para exibição informativa) ─
  const [dadosApi, setDadosApi] = useState<PlacaDados | null>(null);

  // ─ Cascading selects ─
  const marcas     = useMemo(() => getMarcas(tipo), [tipo]);
  const modelos    = useMemo(() => (marca ? getModelos(tipo, marca) : []), [tipo, marca]);
  const anosFab    = useMemo(() => getAnosFabricacao(), []);
  const anosModelo = useMemo(() => getAnosModelo(), []);

  // ─── Consulta de placa ────────────────────────────────────────────────────

  async function handlePlacaLookup() {
    const placaNorm = formatarPlacaInput(placa);
    if (placaNorm.length < 7) {
      toast.error("Informe a placa completa (7 caracteres).");
      return;
    }

    setIsLookingUp(true);
    try {
      const result = await consultarPlacaAction(placaNorm);

      if (result.status === "encontrado") {
        const d = result.dados;
        setDadosApi(d);

        // Preencher todos os campos automaticamente
        setPlaca(formatarPlacaDisplay(d.placa));
        setMarca(d.marca);
        setModelo(d.modelo);
        setVersao(d.versao);
        setAnoFabricacao(String(d.anoFabricacao));
        setAnoModelo(String(d.anoModelo));
        setCor(d.cor);
        setChassi(d.chassi);
        setRenavam(d.renavam);
        setCombustivel(d.combustivel);
        setCambio(d.cambio);
        setSituacaoDocumental(d.situacaoDocumental);
        // ─ Novos campos técnicos da API ─
        if (d.motor)      setMotor(d.motor);
        if (d.ufRegistro) setUfRegistro(d.ufRegistro);
        if (d.leilao)     setLeilao(true);
        if (d.sinistro)   setSinistro(true);
        if (d.chassiRemarcado) setChassiRemarcado(true);
        // Sugerir preço de venda baseado na FIPE, se disponível
        if (d.fipeValorCentavos > 0 && !precoVenda) {
          setPrecoVenda(centavosParaBRL(d.fipeValorCentavos));
        }

        setLookupStatus("found");
        toast.success(
          result.fromCache
            ? "Dados encontrados no cache da plataforma."
            : "Dados do veículo carregados do DETRAN.",
        );
      } else if (result.status === "nao_encontrado") {
        setLookupStatus("not_found");
      } else {
        toast.error(result.mensagem);
        setLookupStatus("not_found");
      }
    } catch {
      toast.error("Erro ao consultar placa. Verifique sua conexão.");
      setLookupStatus("not_found");
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleEntrarManual() {
    setLookupStatus("manual");
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Campos controlados sobrepõem o FormData
    formData.set("tipo",             tipo);
    formData.set("marca",            marca);
    formData.set("modelo",           modelo);
    formData.set("versao",           versao);
    formData.set("anoFabricacao",    anoFabricacao);
    formData.set("anoModelo",        anoModelo);
    formData.set("cor",              cor);
    formData.set("combustivel",      combustivel);
    formData.set("cambio",           cambio);
    formData.set("kmAtual",          kmAtual);
    formData.set("categoria",        categoria);
    formData.set("placa",            formatarPlacaInput(placa));
    formData.set("renavam",          renavam);
    formData.set("chassi",           chassi);
    formData.set("situacaoDocumental", situacaoDocumental);
    formData.set("origem",           origem);
    formData.set("fornecedorId",     fornecedorId);
    formData.set("precoCusto",       precoCusto);
    formData.set("precoVenda",       precoVenda);
    formData.set("observacoes",      observacoes);
    // ─ Novos campos técnicos ─
    formData.set("motor",            motor);
    formData.set("portas",           portas);
    formData.set("ufRegistro",       ufRegistro);
    formData.set("tipoCrv",          tipoCrv);
    formData.set("numeroCrv",        numeroCrv);
    formData.set("chassiRemarcado",  String(chassiRemarcado));
    formData.set("blindado",         String(blindado));
    formData.set("leilao",           String(leilao));
    formData.set("sinistro",         String(sinistro));
    formData.set("manualProprietario", String(manualProprietario));
    formData.set("chaveReserva",     String(chaveReserva));
    formData.set("proprietarioNome", proprietarioNome);
    formData.set("proprietarioDoc",  proprietarioDoc);

    setLimiteAtingido(null);

    startTransition(async () => {
      try {
        const result = isEdicao
          ? await atualizarVeiculoAction(slug, veiculo!.id, null, formData)
          : await criarVeiculoAction(slug, null, formData);

        if (result?.error) {
          if ("upgradeRequired" in result && result.upgradeRequired) {
            setLimiteAtingido(result.error);
          } else {
            toast.error(result.error);
          }
          return;
        }

        // Sucesso: a action redireciona (lança NEXT_REDIRECT) antes de chegar aqui.
        toast.success(isEdicao ? "Veículo atualizado!" : "Veículo cadastrado!");
        router.push(`/t/${slug}/veiculos`);
      } catch (err: unknown) {
        const e = err as { digest?: string; message?: string };
        if (e?.digest?.startsWith("NEXT_REDIRECT")) return;
        toast.error(e?.message ?? "Erro ao salvar veículo.");
      }
    });
  }

  // ─── Passo 1: Busca por placa (apenas no modo criar) ─────────────────────

  if (!isEdicao && lookupStatus === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Consultar placa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe a placa para preencher os dados do veículo automaticamente via DETRAN.
            </p>
            <div className="flex gap-2 max-w-xs">
              <Input
                placeholder="ABC1D23"
                className="uppercase font-mono tracking-widest text-center text-lg"
                maxLength={7}
                value={placa}
                onChange={(e) => setPlaca(formatarPlacaInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handlePlacaLookup(); }
                }}
                disabled={isLookingUp}
              />
              <Button
                type="button"
                onClick={handlePlacaLookup}
                disabled={isLookingUp || placa.length < 7}
              >
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={handleEntrarManual}
            >
              Não tenho a placa — preencher manualmente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Banner de resultado da consulta ─────────────────────────────────────

  const isFormDisabled = isPending;

  const showApiForm = lookupStatus === "found" || lookupStatus === "not_found" || lookupStatus === "manual" || isEdicao;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Banner: limite de veículos do plano atingido ────────────── */}
      {limiteAtingido && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">{limiteAtingido}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enviamos um e-mail com as instruções para migrar de plano — o pagamento ainda é
              feito manualmente, então nossa equipe entra em contato para ativar o upgrade.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href={`/t/${slug}/configuracoes/plano`}>Ver planos e continuar</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Banner: placa encontrada ─────────────────────────────────── */}
      {lookupStatus === "found" && dadosApi && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Dados carregados para a placa <span className="font-mono">{dadosApi.placa}</span>
            </p>
            <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
              {dadosApi.marca} {dadosApi.modelo}
              {dadosApi.municipio && ` • ${dadosApi.municipio}/${dadosApi.uf}`}
              {dadosApi.fipeValorCentavos > 0 && (
                <> • FIPE: {centavosParaBRL(dadosApi.fipeValorCentavos).replace(/\d/, "R$ $&")}</>
              )}
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300 shrink-0">
            DETRAN
          </Badge>
        </div>
      )}

      {/* ── Banner: placa não encontrada ─────────────────────────────── */}
      {lookupStatus === "not_found" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Placa não encontrada na base do DETRAN
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Preencha os dados manualmente abaixo.
            </p>
          </div>
        </div>
      )}

      {/* ── Banner: modo manual sem consulta ─────────────────────────── */}
      {lookupStatus === "manual" && !isEdicao && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <PencilLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Cadastro manual
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
              Preencha todos os campos abaixo.
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Documentação ─────────────────────────────────────────── */}
      {showApiForm && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Documentação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="placa">Placa</Label>
                <div className="flex gap-2">
                  <Input
                    id="placa"
                    name="placa"
                    placeholder="ABC1D23"
                    className="uppercase font-mono tracking-wider"
                    maxLength={8}
                    value={placa}
                    onChange={(e) => setPlaca(formatarPlacaInput(e.target.value))}
                    disabled={isFormDisabled || lookupStatus === "found"}
                  />
                  {/* Botão para re-consultar quando não encontrado ou manual */}
                  {!isEdicao && lookupStatus !== "found" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Consultar placa"
                      onClick={handlePlacaLookup}
                      disabled={isLookingUp || placa.length < 7}
                    >
                      {isLookingUp
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4" />
                      }
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="renavam">RENAVAM</Label>
                <Input
                  id="renavam"
                  name="renavam"
                  placeholder="00000000000"
                  maxLength={11}
                  value={renavam}
                  onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ""))}
                  disabled={isFormDisabled}
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
                  value={chassi}
                  onChange={(e) => setChassi(e.target.value.toUpperCase())}
                  disabled={isFormDisabled}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="situacaoDocumental">Situação documental</Label>
                <Input
                  id="situacaoDocumental"
                  name="situacaoDocumental"
                  placeholder="Ex: Regular, Débitos de IPVA, Restrição financeira..."
                  value={situacaoDocumental}
                  onChange={(e) => setSituacaoDocumental(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Identificação ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4" /> Identificação do veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => {
                    setTipo(v as TipoVeiculo);
                    setMarca("");
                    setModelo("");
                  }}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carros">Carro de passeio</SelectItem>
                    <SelectItem value="motos">Motocicleta</SelectItem>
                    <SelectItem value="caminhoes">Caminhão / Utilitário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marca — Input livre quando vem da API, Select quando manual */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>Marca *</Label>
                  {lookupStatus === "found" && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">API</Badge>
                  )}
                </div>
                {lookupStatus === "found" ? (
                  <Input
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Marca do veículo"
                    disabled={isFormDisabled}
                  />
                ) : (
                  <Select
                    value={marca}
                    onValueChange={(v) => { setMarca(v); setModelo(""); }}
                    disabled={isFormDisabled}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                    <SelectContent>
                      {marcas.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Modelo — Input livre quando vem da API */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>Modelo *</Label>
                  {lookupStatus === "found" && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">API</Badge>
                  )}
                </div>
                {lookupStatus === "found" ? (
                  <Input
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Modelo do veículo"
                    disabled={isFormDisabled}
                  />
                ) : (
                  <Select
                    value={modelo}
                    onValueChange={setModelo}
                    disabled={isFormDisabled || !marca}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={marca ? "Selecione o modelo" : "Selecione a marca primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {modelos.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="versao">Versão / Trim</Label>
                <Input
                  id="versao"
                  name="versao"
                  placeholder="Ex: 1.4 TSI Highline"
                  value={versao}
                  onChange={(e) => setVersao(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ano de fabricação *</Label>
                <Select
                  value={anoFabricacao}
                  onValueChange={setAnoFabricacao}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger><SelectValue placeholder="Ano fab." /></SelectTrigger>
                  <SelectContent>
                    {anosFab.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ano do modelo *</Label>
                <Select
                  value={anoModelo}
                  onValueChange={setAnoModelo}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger><SelectValue placeholder="Ano modelo" /></SelectTrigger>
                  <SelectContent>
                    {anosModelo.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Características ──────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Características</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <Select value={cor} onValueChange={setCor} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cor" /></SelectTrigger>
                  <SelectContent>
                    {CORES_COMUNS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_VEICULO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Combustível</Label>
                <Select value={combustivel} onValueChange={setCombustivel} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue placeholder="Combustível" /></SelectTrigger>
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

              <div className="space-y-1.5">
                <Label>Câmbio</Label>
                <Select value={cambio} onValueChange={setCambio} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue placeholder="Câmbio" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTOMATICO">Automático</SelectItem>
                    <SelectItem value="AUTOMATIZADO">Automatizado (AMT)</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kmAtual">Quilometragem</Label>
                <Input
                  id="kmAtual"
                  name="kmAtual"
                  type="number"
                  min={0}
                  placeholder="Ex: 45000"
                  value={kmAtual}
                  onChange={(e) => setKmAtual(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── 4. Detalhes Técnicos ────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detalhes técnicos</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="motor">Motor</Label>
                  {lookupStatus === "found" && motor && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">API</Badge>
                  )}
                </div>
                <Input
                  id="motor"
                  name="motor"
                  placeholder="Ex: 1.6, 2.0T, 3.0"
                  value={motor}
                  onChange={(e) => setMotor(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Portas</Label>
                <Select value={portas} onValueChange={setPortas} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue placeholder="Nº de portas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 portas</SelectItem>
                    <SelectItem value="3">3 portas</SelectItem>
                    <SelectItem value="4">4 portas</SelectItem>
                    <SelectItem value="5">5 portas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ufRegistro">UF de registro</Label>
                  {lookupStatus === "found" && ufRegistro && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">API</Badge>
                  )}
                </div>
                <Input
                  id="ufRegistro"
                  name="ufRegistro"
                  placeholder="Ex: SP"
                  maxLength={2}
                  className="uppercase"
                  value={ufRegistro}
                  onChange={(e) => setUfRegistro(e.target.value.toUpperCase())}
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tipoCrv">Tipo CRV</Label>
                <Input
                  id="tipoCrv"
                  name="tipoCrv"
                  placeholder="Ex: Definitivo, Baixa definitiva"
                  value={tipoCrv}
                  onChange={(e) => setTipoCrv(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="numeroCrv">Número CRV</Label>
                <Input
                  id="numeroCrv"
                  name="numeroCrv"
                  placeholder="Ex: 00012345678"
                  value={numeroCrv}
                  onChange={(e) => setNumeroCrv(e.target.value.replace(/\D/g, ""))}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── 5. Situação do veículo ───────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4" />
                Situação do veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lookupStatus === "found" && (leilao || sinistro || chassiRemarcado)) && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                  Atenção: a API identificou restrições para este veículo. Verifique os itens marcados abaixo.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    { key: "leilao",             label: "Leilão",                set: setLeilao,             val: leilao,             api: lookupStatus === "found" },
                    { key: "sinistro",            label: "Sinistro / Perda total",set: setSinistro,           val: sinistro,           api: lookupStatus === "found" },
                    { key: "chassiRemarcado",     label: "Chassi remarcado",      set: setChassiRemarcado,    val: chassiRemarcado,    api: lookupStatus === "found" },
                    { key: "blindado",            label: "Blindado",              set: setBlindado,           val: blindado,           api: false },
                    { key: "manualProprietario",  label: "Manual do proprietário",set: setManualProprietario, val: manualProprietario, api: false },
                    { key: "chaveReserva",        label: "Chave reserva",         set: setChaveReserva,       val: chaveReserva,       api: false },
                  ] as const
                ).map(({ key, label, set, val, api }) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors
                      ${val
                        ? "border-primary/40 bg-primary/5 font-medium text-primary"
                        : "border-border hover:bg-muted/50"
                      }
                      ${isFormDisabled ? "cursor-not-allowed opacity-60" : ""}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-primary"
                      checked={val}
                      onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
                      disabled={isFormDisabled}
                    />
                    <span className="flex-1">{label}</span>
                    {api && val && (
                      <Badge variant="secondary" className="text-xs h-4 px-1 shrink-0">API</Badge>
                    )}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── 6. Proprietário anterior ─────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Proprietário anterior (CRV)</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="proprietarioNome">Nome</Label>
                <Input
                  id="proprietarioNome"
                  name="proprietarioNome"
                  placeholder="Nome conforme CRV"
                  value={proprietarioNome}
                  onChange={(e) => setProprietarioNome(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proprietarioDoc">CPF / CNPJ</Label>
                <Input
                  id="proprietarioDoc"
                  name="proprietarioDoc"
                  placeholder="000.000.000-00"
                  value={proprietarioDoc}
                  onChange={(e) => setProprietarioDoc(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── 8. Operacional & Precificação ───────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operacional &amp; Precificação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isEdicao && (
                <div className="space-y-1.5">
                  <Label>Estágio do ciclo de vendas</Label>
                  <Select name="status" defaultValue={veiculo?.status ?? "EM_PREPARACAO"} disabled={isFormDisabled}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEGOCIANDO">Negociando</SelectItem>
                      <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                      <SelectItem value="EM_PREPARACAO">Em preparação</SelectItem>
                      <SelectItem value="RESERVADO">Reservado</SelectItem>
                      <SelectItem value="VENDIDO">Vendido</SelectItem>
                      <SelectItem value="BAIXADO">Baixado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Origem</Label>
                <Select value={origem} onValueChange={setOrigem} disabled={isFormDisabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPRA">Compra</SelectItem>
                    <SelectItem value="CONSIGNACAO">Consignação</SelectItem>
                    <SelectItem value="TROCA">Troca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fornecedores.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Fornecedor</Label>
                  <Select value={fornecedorId} onValueChange={setFornecedorId} disabled={isFormDisabled}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="precoVenda">Preço de venda (R$)</Label>
                  {lookupStatus === "found" && dadosApi?.fipeValorCentavos && dadosApi.fipeValorCentavos > 0 && (
                    <Badge variant="secondary" className="text-xs h-4 px-1">FIPE</Badge>
                  )}
                </div>
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
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  placeholder="Informações adicionais sobre o veículo..."
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Ações ────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => router.push(`/t/${slug}/veiculos`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !marca || !modelo || !anoFabricacao || !anoModelo}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdicao ? "Salvar alterações" : "Cadastrar veículo"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

// ─── Helpers de formatação de placa ──────────────────────────────────────────

function formatarPlacaDisplay(placa: string): string {
  const p = placa.replace(/[^A-Z0-9]/g, "").toUpperCase();
  if (p.length === 7) {
    return `${p.slice(0, 3)}-${p.slice(3)}`;
  }
  return p;
}
