"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  Shield,
  Tag,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  formatarCpf,
  formatarTelefone,
  formatarCep,
  validarCpf,
  limparCpf,
} from "@/lib/utils/cpf";
import { formatarCnpj, validarCnpj } from "@/lib/integrations/cnpj";
import { consultarCep } from "@/lib/integrations/viacep";
import { criarClienteAction, atualizarClienteAction } from "../actions";
import type { CnpjDados } from "@/lib/integrations/cnpj";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ClienteData {
  id: string;
  tipoPessoa: "PF" | "PJ";
  nome: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  aniversarioDia: number | null;
  aniversarioMes: number | null;
  tags: string[];
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  consenteLgpd: boolean;
}

interface Props {
  slug: string;
  cliente?: ClienteData;
  /** Pré-preenchimento via searchParams (/novo?cpf=...) */
  prefilledCpf?: string;
  prefilledCnpj?: string;
  prefilledCnpjDados?: CnpjDados;
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = React.useState("");

  function addTag(raw: string) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9À-ÿ\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!tag || tags.includes(tag)) { setInput(""); return; }
    onChange([...tags, tag]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-background px-3 py-2 min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="flex-1 min-w-[120px] border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder={tags.length === 0 ? "suv, esportivo, caminhonete... (Enter para adicionar)" : "Nova tag..."}
            value={input}
            disabled={disabled}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === " ") {
                e.preventDefault();
                if (input.trim()) addTag(input);
              }
              if (e.key === "Backspace" && !input && tags.length > 0) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => { if (input.trim()) addTag(input); }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Ex: suv, esportivo, familia, caminhonete — usado para segmentação de clientes.
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MESES = [
  { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" },
  { v: 4, l: "Abril" }, { v: 5, l: "Maio" }, { v: 6, l: "Junho" },
  { v: 7, l: "Julho" }, { v: 8, l: "Agosto" }, { v: 9, l: "Setembro" },
  { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" },
];

export function ClienteForm({
  slug,
  cliente,
  prefilledCpf,
  prefilledCnpj,
  prefilledCnpjDados,
}: Props) {
  const router = useRouter();
  const isEdicao = !!cliente;
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string>("");

  // ─ Determina tipo de pessoa inicial ─
  const tipoInicial = prefilledCnpj
    ? "PJ"
    : prefilledCpf
    ? "PF"
    : cliente?.tipoPessoa ?? "PF";

  const [tipoPessoa, setTipoPessoa] = React.useState<"PF" | "PJ">(tipoInicial);
  const isPJ = tipoPessoa === "PJ";

  // ─ Documento ─
  const initialDoc = cliente?.documento
    ? (cliente.tipoPessoa === "PJ"
        ? formatarCnpj(cliente.documento)
        : formatarCpf(cliente.documento))
    : prefilledCnpj
    ? formatarCnpj(prefilledCnpj)
    : prefilledCpf
    ? formatarCpf(prefilledCpf)
    : "";

  const [doc, setDoc] = React.useState(initialDoc);

  function handleDocChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (isPJ) setDoc(formatarCnpj(digits));
    else setDoc(formatarCpf(digits));
  }

  const docLimpo = doc.replace(/\D/g, "");
  const docValido = isPJ ? validarCnpj(docLimpo) : validarCpf(docLimpo);
  const docCompleto = isPJ ? docLimpo.length === 14 : docLimpo.length === 11;

  // ─ Dados do cliente ─
  const [nome, setNome] = React.useState(prefilledCnpjDados?.razaoSocial ?? cliente?.nome ?? "");
  const [email, setEmail] = React.useState(prefilledCnpjDados?.email ?? cliente?.email ?? "");
  const [telefone, setTelefone] = React.useState(
    prefilledCnpjDados?.telefone
      ? formatarTelefone(prefilledCnpjDados.telefone)
      : cliente?.telefone
      ? formatarTelefone(cliente.telefone)
      : "",
  );
  const [anivDia, setAnivDia] = React.useState<string>(
    cliente?.aniversarioDia ? String(cliente.aniversarioDia) : "",
  );
  const [anivMes, setAnivMes] = React.useState<string>(
    cliente?.aniversarioMes ? String(cliente.aniversarioMes) : "",
  );
  const [tags, setTags] = React.useState<string[]>(cliente?.tags ?? []);

  // ─ Endereço ─
  const [cep, setCep] = React.useState(
    prefilledCnpjDados?.cep
      ? formatarCep(prefilledCnpjDados.cep)
      : cliente?.cep
      ? formatarCep(cliente.cep)
      : "",
  );
  const [logradouro, setLogradouro] = React.useState(
    prefilledCnpjDados?.logradouro ?? cliente?.logradouro ?? "",
  );
  const [numero, setNumero] = React.useState(
    prefilledCnpjDados?.numero ?? cliente?.numero ?? "",
  );
  const [complemento, setComplemento] = React.useState(
    prefilledCnpjDados?.complemento ?? cliente?.complemento ?? "",
  );
  const [bairro, setBairro] = React.useState(
    prefilledCnpjDados?.bairro ?? cliente?.bairro ?? "",
  );
  const [cidade, setCidade] = React.useState(
    prefilledCnpjDados?.cidade ?? cliente?.cidade ?? "",
  );
  const [uf, setUf] = React.useState(
    prefilledCnpjDados?.uf ?? cliente?.uf ?? "",
  );

  const [observacoes, setObservacoes] = React.useState(cliente?.observacoes ?? "");
  const [consenteLgpd, setConsenteLgpd] = React.useState(cliente?.consenteLgpd ?? false);
  const [buscandoCep, setBuscandoCep] = React.useState(false);

  // ─── ViaCEP ──────────────────────────────────────────────────────────────

  async function handleBuscarCep() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) { toast.error("Informe o CEP completo."); return; }
    setBuscandoCep(true);
    const dados = await consultarCep(rawCep);
    setBuscandoCep(false);
    if (!dados) { toast.error("CEP não encontrado."); return; }
    setLogradouro(dados.logradouro);
    setBairro(dados.bairro);
    setCidade(dados.localidade);
    setUf(dados.uf);
    if (dados.complemento) setComplemento(dados.complemento);
    toast.success("Endereço preenchido automaticamente.");
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    if (!docValido) { toast.error(`${isPJ ? "CNPJ" : "CPF"} inválido.`); return; }

    const formData = new FormData();
    formData.set("tipoPessoa",     tipoPessoa);
    formData.set("nome",           nome);
    formData.set("documento",      docLimpo);
    formData.set("email",          email);
    formData.set("telefone",       telefone.replace(/\D/g, ""));
    if (anivDia) formData.set("aniversarioDia", anivDia);
    if (anivMes) formData.set("aniversarioMes", anivMes);
    formData.set("tags",           JSON.stringify(tags));
    formData.set("cep",            cep.replace(/\D/g, ""));
    formData.set("logradouro",     logradouro);
    formData.set("numero",         numero);
    formData.set("complemento",    complemento);
    formData.set("bairro",         bairro);
    formData.set("cidade",         cidade);
    formData.set("uf",             uf);
    formData.set("observacoes",    observacoes);
    formData.set("consenteLgpd",   String(consenteLgpd));

    startTransition(async () => {
      const result = isEdicao
        ? await atualizarClienteAction(slug, cliente!.id, null, formData)
        : await criarClienteAction(slug, null, formData);

      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
      } else if (isEdicao) {
        toast.success("Cliente atualizado com sucesso!");
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

      {/* Alerta de dados pré-preenchidos */}
      {prefilledCnpjDados && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Dados preenchidos pela Receita Federal</p>
            <p className="text-xs opacity-80">
              Confirme ou ajuste as informações abaixo antes de salvar.
              {prefilledCnpjDados.situacao !== "ATIVA" && (
                <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">
                  ⚠ Situação: {prefilledCnpjDados.situacao}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Identificação ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {isPJ ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Tipo de pessoa */}
          <div className="space-y-1.5">
            <Label>Tipo de pessoa</Label>
            <Select
              value={tipoPessoa}
              onValueChange={(v) => {
                setTipoPessoa(v as "PF" | "PJ");
                setDoc(""); // limpa o doc ao trocar o tipo
              }}
              disabled={isPending || isEdicao}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">
                  <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Pessoa Física (PF)</span>
                </SelectItem>
                <SelectItem value="PJ">
                  <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Pessoa Jurídica (PJ)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CPF / CNPJ */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="doc">{isPJ ? "CNPJ" : "CPF"} *</Label>
              {docCompleto && (
                docValido
                  ? <Badge variant="secondary" className="h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />Válido
                    </Badge>
                  : <Badge variant="destructive" className="h-5 text-[10px]">Inválido</Badge>
              )}
            </div>
            <Input
              id="doc"
              placeholder={isPJ ? "00.000.000/0000-00" : "000.000.000-00"}
              value={doc}
              onChange={(e) => handleDocChange(e.target.value)}
              maxLength={isPJ ? 18 : 14}
              inputMode="numeric"
              disabled={isPending || isEdicao}
              required
            />
          </div>

          {/* Nome */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">{isPJ ? "Razão social" : "Nome completo"} *</Label>
            <Input
              id="nome"
              placeholder={isPJ ? "Empresa Ltda." : "Nome completo"}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder={isPJ ? "contato@empresa.com.br" : "cliente@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Celular */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Celular / WhatsApp</Label>
            <Input
              id="telefone"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              inputMode="tel"
              maxLength={16}
              disabled={isPending}
            />
          </div>

          {/* Aniversário (somente PF) */}
          {!isPJ && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Aniversário <span className="text-muted-foreground">(dia e mês)</span></Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Dia (1–31)"
                  type="number"
                  min={1}
                  max={31}
                  value={anivDia}
                  onChange={(e) => setAnivDia(e.target.value)}
                  disabled={isPending}
                  className="w-32"
                />
                <Select value={anivMes} onValueChange={setAnivMes} disabled={isPending}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(anivDia || anivMes) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => { setAnivDia(""); setAnivMes(""); }}
                    title="Limpar aniversário"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Usado para campanhas de marketing de aniversário.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Tags de perfil ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4" /> Tags de perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput tags={tags} onChange={setTags} disabled={isPending} />
        </CardContent>
      </Card>

      {/* ── 3. Endereço ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" /> Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(formatarCep(e.target.value))}
                maxLength={9}
                inputMode="numeric"
                disabled={isPending || buscandoCep}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBuscarCep(); } }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleBuscarCep}
                disabled={isPending || buscandoCep || cep.replace(/\D/g, "").length < 8}
                title="Buscar CEP"
              >
                {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input id="logradouro" placeholder="Rua, Av., Estrada..." value={logradouro} onChange={(e) => setLogradouro(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" placeholder="123" value={numero} onChange={(e) => setNumero(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" placeholder="Apto, Sala..." value={complemento} onChange={(e) => setComplemento(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={isPending} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf">UF</Label>
            <Input id="uf" placeholder="SP" maxLength={2} className="uppercase" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} disabled={isPending} />
          </div>
        </CardContent>
      </Card>

      {/* ── 4. LGPD & Observações ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> LGPD &amp; Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${consenteLgpd ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-border hover:bg-muted/40"}`}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-emerald-600"
              checked={consenteLgpd}
              onChange={(e) => setConsenteLgpd(e.target.checked)}
              disabled={isPending}
            />
            <div>
              <p className="text-sm font-medium">Consentimento LGPD</p>
              <p className="text-xs text-muted-foreground">
                O cliente autorizou o uso dos seus dados pessoais para fins de negociação e relacionamento comercial (Lei 13.709/2018).
              </p>
            </div>
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações internas</Label>
            <Textarea id="observacoes" placeholder="Notas sobre o cliente, preferências, histórico..." rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={isPending} />
          </div>
        </CardContent>
      </Card>

      {/* ── Ações ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push(`/t/${slug}/clientes`)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !nome || (docCompleto && !docValido)}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdicao ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
