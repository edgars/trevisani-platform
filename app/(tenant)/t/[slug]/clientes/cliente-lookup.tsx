"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Search, User, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatarCpf } from "@/lib/utils/cpf";
import { formatarCnpj } from "@/lib/integrations/cnpj";
import {
  lookupClienteAction,
  buscarClientesAction,
  type ClienteSugestao,
} from "./actions";

// ─── Detecção de tipo ─────────────────────────────────────────────────────────

type TipoEntrada = "cpf" | "cnpj" | "digitando_doc" | "nome" | null;

function detectarTipo(v: string): TipoEntrada {
  const digits = v.replace(/\D/g, "");
  // Começa a digitar números → modo documento
  if (digits.length > 0 && digits.length === v.replace(/\s/g, "").length) {
    if (digits.length === 11) return "cpf";
    if (digits.length === 14) return "cnpj";
    return "digitando_doc";
  }
  // Tem máscara (pontos/traços) junto de dígitos → documento mascarado
  if (/^\d[\d.\-\/]+$/.test(v.trim())) {
    if (digits.length === 11) return "cpf";
    if (digits.length === 14) return "cnpj";
    return "digitando_doc";
  }
  if (v.trim().length >= 2) return "nome";
  return null;
}

function formatarDocDisplay(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length <= 11) return formatarCpf(digits);
  return formatarCnpj(digits);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ClienteLookup({ slug }: { slug: string }) {
  const router = useRouter();
  const [valor, setValor] = React.useState("");
  const [tipo, setTipo] = React.useState<TipoEntrada>(null);
  const [loading, setLoading] = React.useState(false);
  const [sugestoes, setSugestoes] = React.useState<ClienteSugestao[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Detecta tipo e busca sugestões conforme o usuário digita
  function handleChange(raw: string) {
    const detected = detectarTipo(raw);
    setTipo(detected);

    // Formata documento automaticamente
    const digits = raw.replace(/\D/g, "");
    const isDoc = digits.length > 0 && digits.length === raw.replace(/\s/g, "").length;
    const formatted = isDoc && digits.length <= 14 ? formatarDocDisplay(digits) : raw;
    setValor(formatted);

    // Autocomplete de nome
    if (detected === "nome") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const results = await buscarClientesAction(slug, raw);
        setSugestoes(results);
        setMostrarSugestoes(results.length > 0);
      }, 280);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
    }
  }

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Limpar
  function handleClear() {
    setValor("");
    setTipo(null);
    setSugestoes([]);
    setMostrarSugestoes(false);
    inputRef.current?.focus();
  }

  // Selecionar sugestão
  function handleSugestao(cliente: ClienteSugestao) {
    setMostrarSugestoes(false);
    router.push(`/t/${slug}/clientes/${cliente.id}/editar`);
  }

  // Buscar CPF / CNPJ
  async function handleBuscar() {
    const digits = valor.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) completo.");
      return;
    }
    setLoading(true);
    const result = await lookupClienteAction(slug, digits);
    setLoading(false);

    switch (result.type) {
      case "found":
        router.push(`/t/${slug}/clientes/${result.clienteId}/editar`);
        break;
      case "novo_pf":
        router.push(`/t/${slug}/clientes/novo?cpf=${result.cpf}`);
        break;
      case "novo_pj":
        router.push(
          `/t/${slug}/clientes/novo?cnpj=${result.cnpj}&dados=${encodeURIComponent(
            JSON.stringify(result.dados),
          )}`,
        );
        break;
      case "cnpj_nao_encontrado":
        // Cadastrar PJ manualmente
        router.push(`/t/${slug}/clientes/novo?cnpj=${result.cnpj}`);
        break;
      case "error":
        toast.error(result.message);
        break;
    }
  }

  const podeNovo = tipo === "nome" || tipo === null;

  return (
    <div className="space-y-3">
      {/* Campo + botão */}
      <div ref={containerRef} className="relative flex gap-2">
        <div className="relative flex-1">
          {/* Ícone à esquerda */}
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {tipo === "cnpj" || (tipo === "digitando_doc" && valor.replace(/\D/g, "").length > 11) ? (
              <Building2 className="h-4 w-4" />
            ) : tipo === "cpf" ? (
              <User className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          <Input
            ref={inputRef}
            value={valor}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (tipo === "cpf" || tipo === "cnpj")) handleBuscar();
              if (e.key === "Escape") handleClear();
              if (e.key === "ArrowDown" && sugestoes.length > 0) {
                e.preventDefault();
                (document.querySelector("[data-sugestao]") as HTMLElement)?.focus();
              }
            }}
            onFocus={() => sugestoes.length > 0 && setMostrarSugestoes(true)}
            placeholder="Buscar por CPF, CNPJ ou nome do cliente..."
            className="h-11 pl-10 pr-10 text-base"
            autoComplete="off"
          />

          {/* Badge de tipo */}
          {tipo && tipo !== "nome" && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {tipo === "cpf" && (
                <Badge variant="secondary" className="text-[10px] font-mono">CPF</Badge>
              )}
              {tipo === "cnpj" && (
                <Badge variant="secondary" className="text-[10px] font-mono">CNPJ</Badge>
              )}
              {tipo === "digitando_doc" && (
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  {valor.replace(/\D/g, "").length}/14
                </Badge>
              )}
            </div>
          )}

          {/* Limpar */}
          {valor && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              style={{ display: tipo && tipo !== "nome" ? "none" : undefined }}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown autocomplete (nome) */}
          {mostrarSugestoes && sugestoes.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-popover shadow-lg">
              {sugestoes.map((c, i) => (
                <button
                  key={c.id}
                  data-sugestao={i === 0 ? "first" : undefined}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                  onClick={() => handleSugestao(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSugestao(c);
                  }}
                >
                  <span className="shrink-0 rounded-full bg-muted p-1">
                    {c.tipoPessoa === "PJ" ? (
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.tipoPessoa === "PF"
                        ? formatarCpf(c.documento)
                        : formatarCnpj(c.documento)}
                      {c.cidade ? ` · ${c.cidade}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão de ação */}
        {(tipo === "cpf" || tipo === "cnpj") ? (
          <Button
            type="button"
            onClick={handleBuscar}
            disabled={loading}
            className="h-11 shrink-0"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            className="h-11 shrink-0"
            onClick={() => router.push(`/t/${slug}/clientes/novo`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo
          </Button>
        )}
      </div>

      {/* Dica contextual */}
      <p className="text-xs text-muted-foreground">
        {tipo === "cpf" &&
          "CPF detectado — pressione Enter ou clique em Buscar para verificar se o cliente já está cadastrado."}
        {tipo === "cnpj" &&
          "CNPJ detectado — buscaremos os dados da Receita Federal automaticamente."}
        {tipo === "digitando_doc" &&
          `Digitando documento... (${valor.replace(/\D/g, "").length} de 11/14 dígitos)`}
        {(tipo === "nome" || tipo === null) &&
          "Digite CPF, CNPJ ou parte do nome para localizar ou cadastrar um cliente."}
      </p>
    </div>
  );
}
