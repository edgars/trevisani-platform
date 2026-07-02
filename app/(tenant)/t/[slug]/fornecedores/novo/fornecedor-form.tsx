"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2, MapPin, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  criarFornecedorAction,
  atualizarFornecedorAction,
  consultarCnpjAction,
  consultarCepAction,
} from "../actions";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TipoPessoa = "PF" | "PJ";

export interface FornecedorCnaeData {
  codigo: string;
  descricao: string;
  principal: boolean;
}

export interface FornecedorData {
  id: string;
  tipoPessoa: TipoPessoa;
  nome: string;
  razaoSocial?: string | null;
  documento: string;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  situacaoCadastral?: string | null;
  naturezaJuridica?: string | null;
  porteEmpresa?: string | null;
  dataInicioAtividade?: string | null; // ISO
  cnaes?: FornecedorCnaeData[];
}

interface Props {
  slug: string;
  fornecedor?: FornecedorData; // undefined = modo criar
}

// ─── Máscaras ─────────────────────────────────────────────────────────────────

function mascaraCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraCNPJ(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function mascaraCEP(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function mascaraCnae(codigo: string) {
  // 8219999 → 8219-9/99
  return codigo.replace(/^(\d{4})(\d)(\d{2})$/, "$1-$2/$3");
}

// ─── Componente de campo com label ────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Formulário principal ─────────────────────────────────────────────────────

export function FornecedorForm({ slug, fornecedor }: Props) {
  const isEdicao = !!fornecedor;
  const router = useRouter();

  // ─ Tipo de pessoa ─
  const [tipo, setTipo] = useState<TipoPessoa>(fornecedor?.tipoPessoa ?? "PJ");

  // ─ Documento com máscara ─
  const [documento, setDocumento] = useState(
    fornecedor?.documento
      ? fornecedor.tipoPessoa === "PF"
        ? mascaraCPF(fornecedor.documento)
        : mascaraCNPJ(fornecedor.documento)
      : "",
  );

  // ─ Dados básicos (controlados para permitir auto-preenchimento) ─
  const [razaoSocial, setRazaoSocial] = useState(fornecedor?.razaoSocial ?? "");
  const [nome, setNome] = useState(fornecedor?.nome ?? "");
  const [email, setEmail] = useState(fornecedor?.email ?? "");
  const [telefone, setTelefone] = useState(
    fornecedor?.telefone ? mascaraTelefone(fornecedor.telefone) : "",
  );

  // ─ CEP e endereço ─
  const [cep, setCep] = useState(
    fornecedor?.cep ? mascaraCEP(fornecedor.cep) : "",
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState(fornecedor?.logradouro ?? "");
  const [numero, setNumero] = useState(fornecedor?.numero ?? "");
  const [complemento, setComplemento] = useState(fornecedor?.complemento ?? "");
  const [bairro, setBairro] = useState(fornecedor?.bairro ?? "");
  const [cidade, setCidade] = useState(fornecedor?.cidade ?? "");
  const [estado, setEstado] = useState(fornecedor?.estado ?? "");
  const numeroRef = useRef<HTMLInputElement>(null);

  // ─ Dados da Receita (consulta CNPJ) ─
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [situacaoCadastral, setSituacaoCadastral] = useState(
    fornecedor?.situacaoCadastral ?? "",
  );
  const [naturezaJuridica, setNaturezaJuridica] = useState(
    fornecedor?.naturezaJuridica ?? "",
  );
  const [porteEmpresa, setPorteEmpresa] = useState(fornecedor?.porteEmpresa ?? "");
  const [dataInicioAtividade, setDataInicioAtividade] = useState(
    fornecedor?.dataInicioAtividade ?? "",
  );
  const [cnaes, setCnaes] = useState<FornecedorCnaeData[]>(fornecedor?.cnaes ?? []);
  const [dadosCnpjRaw, setDadosCnpjRaw] = useState<string>("");

  // ─ Server Action ─
  const action = isEdicao
    ? atualizarFornecedorAction.bind(null, slug, fornecedor!.id)
    : criarFornecedorAction.bind(null, slug);

  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  // ─ Consulta CNPJ (OpenCNPJ) ────────────────────────────────────────────────

  async function buscarCnpj() {
    const digitos = documento.replace(/\D/g, "");
    if (digitos.length !== 14) {
      toast.error("Informe o CNPJ completo (14 dígitos).");
      return;
    }
    setBuscandoCnpj(true);
    try {
      const result = await consultarCnpjAction(digitos);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Erro na consulta do CNPJ.");
        return;
      }
      const d = result.data;
      setRazaoSocial(d.razaoSocial);
      setNome(d.nomeFantasia);
      if (d.email) setEmail(d.email);
      if (d.telefone) setTelefone(mascaraTelefone(d.telefone));
      if (d.cep) setCep(mascaraCEP(d.cep));
      setLogradouro(d.logradouro);
      setNumero(d.numero);
      setComplemento(d.complemento);
      setBairro(d.bairro);
      setCidade(d.cidade);
      setEstado(d.estado);
      setSituacaoCadastral(d.situacaoCadastral);
      setNaturezaJuridica(d.naturezaJuridica);
      setPorteEmpresa(d.porteEmpresa);
      setDataInicioAtividade(d.dataInicioAtividade);
      setCnaes(d.cnaes);
      setDadosCnpjRaw(JSON.stringify(d.raw));
      toast.success(`Dados de ${d.razaoSocial} carregados.`);
    } finally {
      setBuscandoCnpj(false);
    }
  }

  // ─ Busca ViaCEP ───────────────────────────────────────────────────────────

  async function buscarCep(cepFormatado: string) {
    const digitos = cepFormatado.replace(/\D/g, "");
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const result = await consultarCepAction(digitos);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Erro ao consultar o CEP.");
        return;
      }
      setLogradouro(result.data.logradouro);
      setBairro(result.data.bairro);
      setCidade(result.data.cidade);
      setEstado(result.data.uf);
      setTimeout(() => numeroRef.current?.focus(), 50);
    } finally {
      setBuscandoCep(false);
    }
  }

  // ─ Troca de tipo PF ↔ PJ ─────────────────────────────────────────────────

  function handleTipoChange(novoTipo: TipoPessoa) {
    setTipo(novoTipo);
    setDocumento("");
    if (novoTipo === "PF") {
      // PF não tem dados da Receita nem CNAEs
      setSituacaoCadastral("");
      setNaturezaJuridica("");
      setPorteEmpresa("");
      setDataInicioAtividade("");
      setCnaes([]);
      setDadosCnpjRaw("");
    }
  }

  const cnaePrincipal = cnaes.find((c) => c.principal);
  const cnaesSecundarios = cnaes.filter((c) => !c.principal);

  return (
    <form action={formAction} className="space-y-6">
      {/* ── Tipo de pessoa ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="hidden" name="tipoPessoa" value={tipo} />
          <div className="flex gap-2">
            {(["PJ", "PF"] as TipoPessoa[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTipoChange(t)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  tipo === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t === "PJ" ? "Pessoa Jurídica (empresa)" : "Pessoa Física"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Dados básicos ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Dados do fornecedor
            {tipo === "PJ" && situacaoCadastral && (
              <Badge
                variant={situacaoCadastral === "Ativa" ? "success" : "warning"}
              >
                {situacaoCadastral}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* CNPJ primeiro, com busca automática (apenas PJ) */}
          {tipo === "PJ" ? (
            <div className="sm:col-span-2">
              <Field
                label="CNPJ"
                required
                hint="Pressione Enter ou clique em Buscar para preencher os dados automaticamente."
              >
                <div className="flex gap-2">
                  <Input
                    name="documento"
                    value={documento}
                    onChange={(e) => setDocumento(mascaraCNPJ(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        buscarCnpj();
                      }
                    }}
                    placeholder="00.000.000/0001-00"
                    required
                    className="max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      buscandoCnpj || documento.replace(/\D/g, "").length !== 14
                    }
                    onClick={buscarCnpj}
                    className="gap-2"
                  >
                    {buscandoCnpj ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </Field>
            </div>
          ) : (
            <Field label="CPF" required>
              <Input
                name="documento"
                value={documento}
                onChange={(e) => setDocumento(mascaraCPF(e.target.value))}
                placeholder="000.000.000-00"
                required
              />
            </Field>
          )}

          {tipo === "PJ" && (
            <div className="sm:col-span-2">
              <Field label="Razão Social" required>
                <Input
                  name="razaoSocial"
                  placeholder="Empresa Comércio de Veículos Ltda."
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  required
                />
              </Field>
            </div>
          )}

          <Field label={tipo === "PJ" ? "Nome Fantasia" : "Nome Completo"} required>
            <Input
              name="nome"
              placeholder={tipo === "PJ" ? "Auto Brasil" : "João da Silva"}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Field>

          <Field label="E-mail">
            <Input
              name="email"
              type="email"
              placeholder="contato@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Telefone / WhatsApp">
            <Input
              name="telefone"
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
            />
          </Field>

          {/* Dados da Receita (somente leitura, preenchidos pela consulta) */}
          {tipo === "PJ" && (naturezaJuridica || porteEmpresa) && (
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
              <Field label="Natureza jurídica">
                <Input value={naturezaJuridica} readOnly className="bg-muted/40" />
              </Field>
              <Field label="Porte">
                <Input value={porteEmpresa} readOnly className="bg-muted/40" />
              </Field>
              <Field label="Início de atividade">
                <Input
                  value={
                    dataInicioAtividade
                      ? new Date(dataInicioAtividade + "T00:00:00").toLocaleDateString("pt-BR")
                      : ""
                  }
                  readOnly
                  className="bg-muted/40"
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CNAEs (apenas PJ, vindos da consulta) ────────────────────────── */}
      {tipo === "PJ" && cnaes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Atividades econômicas (CNAE)
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                {cnaes.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cnaePrincipal && (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <Badge variant="default" className="mt-0.5 shrink-0">
                  Principal
                </Badge>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">
                    {mascaraCnae(cnaePrincipal.codigo)}
                  </p>
                  <p className="text-sm">{cnaePrincipal.descricao}</p>
                </div>
              </div>
            )}
            {cnaesSecundarios.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Secundários
                </p>
                <ul className="divide-y rounded-lg border">
                  {cnaesSecundarios.map((c) => (
                    <li key={c.codigo} className="flex items-baseline gap-3 px-3 py-2">
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {mascaraCnae(c.codigo)}
                      </span>
                      <span className="text-sm">{c.descricao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Endereço (ViaCEP) ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CEP */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>CEP</Label>
              <Input
                name="cep"
                value={cep}
                onChange={(e) => {
                  const v = mascaraCEP(e.target.value);
                  setCep(v);
                  if (v.replace(/\D/g, "").length === 8) buscarCep(v);
                }}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={buscandoCep || cep.replace(/\D/g, "").length !== 8}
              onClick={() => buscarCep(cep)}
              title="Buscar CEP"
            >
              {buscandoCep ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Logradouro, Número, Complemento */}
          <div className="grid gap-4 sm:grid-cols-[1fr_120px_160px]">
            <Field label="Logradouro">
              <Input
                name="logradouro"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Av., etc."
              />
            </Field>
            <Field label="Número" required={!!cep}>
              <Input
                ref={numeroRef}
                name="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
              />
            </Field>
            <Field label="Complemento" hint="Apto, sala, andar…">
              <Input
                name="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto 42"
              />
            </Field>
          </div>

          {/* Bairro, Cidade, Estado */}
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
            <Field label="Bairro">
              <Input
                name="bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Centro"
              />
            </Field>
            <Field label="Cidade">
              <Input
                name="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
              />
            </Field>
            <Field label="UF">
              <Input
                name="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Observações ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={fornecedor?.observacoes ?? ""}
            placeholder="Informações adicionais sobre o fornecedor…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </CardContent>
      </Card>

      {/* ── Dados da Receita para o submit (hidden) ──────────────────────── */}
      {tipo === "PJ" && (
        <>
          <input type="hidden" name="situacaoCadastral" value={situacaoCadastral} />
          <input type="hidden" name="naturezaJuridica" value={naturezaJuridica} />
          <input type="hidden" name="porteEmpresa" value={porteEmpresa} />
          <input type="hidden" name="dataInicioAtividade" value={dataInicioAtividade} />
          <input type="hidden" name="cnaesJson" value={JSON.stringify(cnaes)} />
          {dadosCnpjRaw && (
            <input type="hidden" name="dadosCnpjJson" value={dadosCnpjRaw} />
          )}
        </>
      )}

      {/* ── Ações ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/t/${slug}/fornecedores`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdicao ? "Salvar alterações" : "Cadastrar fornecedor"}
        </Button>
      </div>
    </form>
  );
}
