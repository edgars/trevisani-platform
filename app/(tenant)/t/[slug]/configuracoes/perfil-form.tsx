"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  atualizarPerfilTenantAction,
  type PerfilActionResult,
} from "./actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cnpjMask(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
}

// ─── Logo Uploader ────────────────────────────────────────────────────────────

interface LogoUploaderProps {
  currentUrl: string;
  savedUrl: string;            // URL que veio da ação (após salvar)
  errors?: Record<string, string[]>;
}

function LogoUploader({ currentUrl, savedUrl, errors }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Quando a action retorna uma nova URL, descarta o preview local
  useEffect(() => {
    if (savedUrl) {
      setPreview(null);
      setFileName(null);
    }
  }, [savedUrl]);

  const displayUrl = preview ?? savedUrl ?? currentUrl;

  function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) return; // validação visual antecipada
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearPreview() {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <Label>Logo da loja</Label>

      <div className="flex items-start gap-4">
        {/* Área de drop / preview */}
        <div
          className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/60 hover:bg-muted"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          title="Clique ou arraste uma imagem"
        >
          {displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayUrl}
              alt="Logo atual"
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Upload className="h-7 w-7 text-muted-foreground" />
          )}
        </div>

        {/* Instruções + ações */}
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            name="logoFile"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={handleChange}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {displayUrl ? "Trocar logo" : "Enviar logo"}
          </Button>

          {fileName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="max-w-[160px] truncate">{fileName}</span>
              <button
                type="button"
                onClick={clearPreview}
                className="rounded hover:text-destructive"
                title="Remover arquivo selecionado"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP ou SVG · máx. 2 MB
          </p>
        </div>
      </div>

      {/* Campo hidden para manter a URL atual caso não faça novo upload */}
      <input type="hidden" name="logoUrl" value={displayUrl ?? ""} />

      <FieldError errors={errors} name="logo" />
    </div>
  );
}

// ─── Form principal ───────────────────────────────────────────────────────────

interface PerfilFormProps {
  slug: string;
  defaultValues: {
    nome: string;
    razaoSocial: string;
    cnpj: string;
    telefone: string;
    email: string;
    dominio: string;
    logoUrl: string;
  };
}

export function PerfilForm({ slug, defaultValues }: PerfilFormProps) {
  const action = atualizarPerfilTenantAction.bind(null, slug);
  const [state, dispatch, pending] = useActionState<PerfilActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && !state.ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state]);

  const errors = state && !state.ok ? state.errors : undefined;
  const savedLogoUrl = state?.ok ? (state.logoUrl ?? defaultValues.logoUrl) : defaultValues.logoUrl;

  return (
    <form action={dispatch} className="space-y-6">
      {/* Feedback de sucesso */}
      {state?.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Dados salvos com sucesso.
        </div>
      )}

      {errors?._ && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors._[0]}
        </p>
      )}

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <LogoUploader
        currentUrl={defaultValues.logoUrl}
        savedUrl={savedLogoUrl}
        errors={errors}
      />

      {/* ── Identificação ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Identificação
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome da loja *</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={defaultValues.nome}
              placeholder="Trevisani Veículos"
              required
            />
            <FieldError errors={errors} name="nome" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="razaoSocial">Razão social</Label>
            <Input
              id="razaoSocial"
              name="razaoSocial"
              defaultValue={defaultValues.razaoSocial}
              placeholder="Trevisani Comércio de Veículos Ltda"
            />
            <FieldError errors={errors} name="razaoSocial" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              defaultValue={defaultValues.cnpj}
              placeholder="00.000.000/0001-00"
              onChange={(e) => {
                e.target.value = cnpjMask(e.target.value);
              }}
            />
            <FieldError errors={errors} name="cnpj" />
          </div>
        </div>
      </div>

      {/* ── Contato ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Contato
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone / WhatsApp</Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              defaultValue={defaultValues.telefone}
              placeholder="(11) 99999-9999"
            />
            <FieldError errors={errors} name="telefone" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues.email}
              placeholder="contato@suarevenda.com.br"
            />
            <FieldError errors={errors} name="email" />
          </div>
        </div>
      </div>

      {/* ── Presença online ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Presença online
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="dominio">Domínio personalizado</Label>
          <Input
            id="dominio"
            name="dominio"
            defaultValue={defaultValues.dominio}
            placeholder="minharevenda.com.br"
          />
          <p className="text-xs text-muted-foreground">
            Configure um CNAME apontando para{" "}
            <code className="rounded bg-muted px-1">cname.volante7.com.br</code> no seu provedor de DNS.
          </p>
          <FieldError errors={errors} name="dominio" />
        </div>
      </div>

      {/* ── Ações ────────────────────────────────────────────────────── */}
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
