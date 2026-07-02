"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { criarFornecedorAction, atualizarFornecedorAction } from "../actions";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TipoPessoa = "PF" | "PJ";

interface ViaCepResult {
  logradouro: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  erro?: boolean;
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
      ? tipo === "PF"
        ? mascaraCPF(fornecedor.documento)
        : mascaraCNPJ(fornecedor.documento)
      : "",
  );

  // ─ Telefone com máscara ─
  const [telefone, setTelefone] = useState(
    fornecedor?.telefone ? mascaraTelefone(fornecedor.telefone) : "",
  );

  // ─ CEP e endereço ─
  const [cep, setCep] = useState(
    fornecedor?.cep ? mascaraCEP(fornecedor.cep) : "",
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [logradouro, setLogradouro] = useState(fornecedor?.logradouro ?? "");
  const [bairro, setBairro] = useState(fornecedor?.bairro ?? "");
  const [cidade, setCidade] = useState(fornecedor?.cidade ?? "");
  const [estado, setEstado] = useState(fornecedor?.estado ?? "");
  const numeroRef = useRef<HTMLInputElement>(null);

  // ─ Server Action ─
  const action = isEdicao
    ? atualizarFornecedorAction.bind(null, slug, fornecedor!.id)
    : criarFornecedorAction.bind(null, slug);

  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  // ─ Busca ViaCEP ───────────────────────────────────────────────────────────

  async function buscarCep(cepFormatado: string) {
    const digitos = cepFormatado.replace(/\D/g, "");
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const data: ViaCepResult = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setLogradouro(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setEstado(data.uf);
      setTimeout(() => numeroRef.current?.focus(), 50);
    } catch {
      toast.error("Erro ao consultar o CEP. Verifique sua conexão.");
    } finally {
      setBuscandoCep(false);
    }
  }

  // ─ Troca de tipo PF ↔ PJ ─────────────────────────────────────────────────

  function handleTipoChange(novoTipo: TipoPessoa) {
    setTipo(novoTipo);
    setDocumento("");
  }

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
          <CardTitle className="text-base">Dados do fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {tipo === "PJ" && (
            <div className="sm:col-span-2">
              <Field label="Razão Social" required>
                <Input
                  name="razaoSocial"
                  placeholder="Empresa Comércio de Veículos Ltda."
                  defaultValue={fornecedor?.razaoSocial ?? ""}
                  required
                />
              </Field>
            </div>
          )}

          <Field label={tipo === "PJ" ? "Nome Fantasia" : "Nome Completo"} required>
            <Input
              name="nome"
              placeholder={tipo === "PJ" ? "Auto Brasil" : "João da Silva"}
              defaultValue={fornecedor?.nome ?? ""}
              required
            />
          </Field>

          <Field label={tipo === "PJ" ? "CNPJ" : "CPF"} required>
            <Input
              name="documento"
              value={documento}
              onChange={(e) =>
                setDocumento(
                  tipo === "PF"
                    ? mascaraCPF(e.target.value)
                    : mascaraCNPJ(e.target.value),
                )
              }
              placeholder={tipo === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"}
              required
            />
          </Field>

          <Field label="E-mail">
            <Input
              name="email"
              type="email"
              placeholder="contato@empresa.com.br"
              defaultValue={fornecedor?.email ?? ""}
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
        </CardContent>
      </Card>

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
                readOnly={!!logradouro && !buscandoCep}
                className={logradouro ? "bg-muted/40" : ""}
              />
            </Field>
            <Field label="Número" required={!!cep}>
              <Input
                ref={numeroRef}
                name="numero"
                defaultValue={fornecedor?.numero ?? ""}
                placeholder="123"
              />
            </Field>
            <Field label="Complemento" hint="Apto, sala, andar…">
              <Input
                name="complemento"
                defaultValue={fornecedor?.complemento ?? ""}
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
                readOnly={!!bairro && !buscandoCep}
                className={bairro ? "bg-muted/40" : ""}
              />
            </Field>
            <Field label="Cidade">
              <Input
                name="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
                readOnly={!!cidade && !buscandoCep}
                className={cidade ? "bg-muted/40" : ""}
              />
            </Field>
            <Field label="UF">
              <Input
                name="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                readOnly={!!estado && !buscandoCep}
                className={estado ? "bg-muted/40" : ""}
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
