"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { salvarWebsite, uploadLogo } from "./actions";
import type { TemaWebsite, FonteWebsite } from "@prisma/client";
import { TEMA_LABELS, TEMA_DESCRIPTIONS } from "@/lib/website/themes";
import { FONTE_LABELS } from "@/lib/website/fonts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebsiteEditorProps {
  slug: string;
  tenantNome: string;
  config: {
    publicado: boolean;
    tema: TemaWebsite;
    fonte: FonteWebsite;
    corPrimaria: string;
    corDestaque: string;
    logoUrl: string | null;
    heroTitulo: string | null;
    heroSubtitulo: string | null;
    sobre: string | null;
    telefone: string | null;
    whatsapp: string | null;
    endereco: string | null;
    instagram: string | null;
    seoTitulo: string | null;
    seoDescricao: string | null;
  } | null;
}

type AutoSaveStatus = "idle" | "saving" | "saved";

const TEMAS: TemaWebsite[] = ["CLASSICO", "MODERNO", "MINIMAL"];
const FONTES: FonteWebsite[] = ["INTER", "POPPINS", "ROBOTO", "LATO", "MONTSERRAT"];

// ─── Component ───────────────────────────────────────────────────────────────

export function WebsiteEditor({ slug, tenantNome, config }: WebsiteEditorProps) {
  const c = config;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const isLocal = rootDomain.includes("localhost");
  const vitrinUrl = `${isLocal ? "http" : "https"}://${slug}.${rootDomain}`;

  const formRef = useRef<HTMLFormElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controlled state — all fields that affect the live preview or need instant save
  const [publicado, setPublicado]       = useState(c?.publicado ?? false);
  const [corPrimaria, setCorPrimaria]   = useState(c?.corPrimaria ?? "#0f172a");
  const [corDestaque, setCorDestaque]   = useState(c?.corDestaque ?? "#e11d48");
  const [tema, setTema]                 = useState<TemaWebsite>(c?.tema ?? "CLASSICO");
  const [logoUrl, setLogoUrl]           = useState(c?.logoUrl ?? null);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");

  const [, startTransition] = useTransition();

  // ─── Auto-save ────────────────────────────────────────────────────────────

  function scheduleAutoSave(delayMs = 1200) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      const fd = new FormData(form);
      fd.set("corPrimaria", corPrimaria);
      fd.set("corDestaque", corDestaque);
      fd.set("tema", tema);
      fd.set("publicado", String(publicado));
      startTransition(async () => {
        try {
          await salvarWebsite(slug, { status: "idle" }, fd);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2500);
        } catch {
          setAutoSaveStatus("idle");
        }
      });
    }, delayMs);
  }

  function handleColorChange(setter: React.Dispatch<React.SetStateAction<string>>, value: string) {
    setter(value);
    scheduleAutoSave(600);
  }

  function handleFieldChange() {
    scheduleAutoSave(1200);
  }

  // ─── Logo upload ──────────────────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadLogo(slug, fd);
      setUploading(false);
      if (result.success) {
        setLogoUrl(result.url);
      } else {
        setUploadError(result.error);
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form ref={formRef} className="space-y-10" onSubmit={(e) => e.preventDefault()}>

      {/* ── Status bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div>
          <p className="font-semibold">Status da vitrine</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {publicado ? "Sua vitrine está pública e acessível." : "Vitrine despublicada — apenas você pode ver."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[90px]">
            {autoSaveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</>}
            {autoSaveStatus === "saved"  && <><CheckCircle2 className="h-3 w-3 text-green-500" /> Salvo</>}
          </span>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="hidden" name="publicado" value={publicado.toString()} />
            <button
              type="button"
              onClick={() => { setPublicado((v) => !v); scheduleAutoSave(300); }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${publicado ? "bg-green-500" : "bg-neutral-200"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${publicado ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium">Publicar</span>
          </label>

          <a href={vitrinUrl} target="_blank" rel="noopener noreferrer"
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
            Ver vitrine ↗
          </a>
        </div>
      </div>

      {/* ── Tema ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Tema</h2>
        <input type="hidden" name="tema" value={tema} />
        <div className="grid gap-3 sm:grid-cols-3">
          {TEMAS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTema(t); scheduleAutoSave(300); }}
              className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                tema === t ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
              }`}
            >
              <TemaPreview tema={t} corPrimaria={corPrimaria} corDestaque={corDestaque} />
              <div className="p-3">
                <p className="font-semibold text-sm">{TEMA_LABELS[t]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{TEMA_DESCRIPTIONS[t]}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Cores ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Cores</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Cor principal</label>
            <div className="flex items-center gap-3">
              <input type="color" name="corPrimaria" value={corPrimaria}
                onChange={(e) => handleColorChange(setCorPrimaria, e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border p-0.5" />
              <span className="text-sm text-muted-foreground">Cabeçalho, botões e textos de destaque</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cor de destaque</label>
            <div className="flex items-center gap-3">
              <input type="color" name="corDestaque" value={corDestaque}
                onChange={(e) => handleColorChange(setCorDestaque, e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border p-0.5" />
              <span className="text-sm text-muted-foreground">Preços, CTAs e badges</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fonte ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Fonte</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {FONTES.map((fonte) => (
            <label key={fonte} className="cursor-pointer">
              <input type="radio" name="fonte" value={fonte}
                defaultChecked={(c?.fonte ?? "INTER") === fonte}
                className="sr-only peer" onChange={handleFieldChange} />
              <div className="rounded-lg border-2 px-3 py-2 text-center text-sm transition-all peer-checked:border-primary peer-checked:bg-accent/50 hover:bg-accent/30">
                {FONTE_LABELS[fonte]}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Logo</h2>
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl border bg-neutral-50 overflow-hidden">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={140} height={70} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-xs text-muted-foreground">{tenantNome}</span>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="sr-only" onChange={handleLogoUpload} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
              {uploading ? "Enviando..." : "Trocar logo"}
            </button>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WEBP ou SVG · máx 2 MB</p>
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>
        </div>
      </section>

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Conteúdo</h2>
        <div className="space-y-4">
          <Field label="Título do hero" name="heroTitulo" defaultValue={c?.heroTitulo ?? ""}
            placeholder="Ex: Os melhores carros da região" maxLength={120} onChange={handleFieldChange} />
          <Field label="Subtítulo do hero" name="heroSubtitulo" defaultValue={c?.heroSubtitulo ?? ""}
            placeholder="Ex: Encontre o carro perfeito com as melhores condições." maxLength={240} onChange={handleFieldChange} />
          <Textarea label="Sobre a loja" name="sobre" defaultValue={c?.sobre ?? ""}
            placeholder="Breve descrição da sua loja para o bloco 'Sobre nós'." rows={4} onChange={handleFieldChange} />
        </div>
      </section>

      {/* ── Contato ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Contato e redes sociais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" name="telefone" defaultValue={c?.telefone ?? ""}
            placeholder="(11) 99999-0000" onChange={handleFieldChange} />
          <Field label="WhatsApp (somente dígitos)" name="whatsapp" defaultValue={c?.whatsapp ?? ""}
            placeholder="5511999990000" onChange={handleFieldChange} />
          <Field label="Endereço" name="endereco" defaultValue={c?.endereco ?? ""}
            placeholder="Av. Paulista, 1000 – São Paulo, SP" className="sm:col-span-2" onChange={handleFieldChange} />
          <Field label="Instagram (sem @)" name="instagram" defaultValue={c?.instagram ?? ""}
            placeholder="sualojasp" onChange={handleFieldChange} />
        </div>
      </section>

      {/* ── SEO ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">SEO</h2>
        <div className="space-y-4">
          <Field label="Título da página (até 70 caracteres)" name="seoTitulo"
            defaultValue={c?.seoTitulo ?? ""} placeholder="Ex: Loja SP – Compra e Venda de Veículos"
            maxLength={70} onChange={handleFieldChange} />
          <Textarea label="Descrição (até 160 caracteres)" name="seoDescricao"
            defaultValue={c?.seoDescricao ?? ""} placeholder="Uma frase sobre sua loja para aparecer no Google."
            rows={2} onChange={handleFieldChange} />
        </div>
      </section>
    </form>
  );
}

// ─── Theme preview thumbnails ─────────────────────────────────────────────────

function TemaPreview({
  tema,
  corPrimaria = "#0f172a",
  corDestaque = "#e11d48",
}: {
  tema: TemaWebsite;
  corPrimaria?: string;
  corDestaque?: string;
}) {
  if (tema === "CLASSICO") {
    return (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden>
        <rect width="280" height="160" fill="#f8fafc" />
        {/* Header */}
        <rect width="280" height="30" fill={corPrimaria} />
        <rect x="12" y="9" width="40" height="12" rx="2" fill={corDestaque} />
        <rect x="160" y="11" width="22" height="8" rx="2" fill="#ffffff" opacity="0.35" />
        <rect x="188" y="11" width="22" height="8" rx="2" fill="#ffffff" opacity="0.35" />
        <rect x="216" y="11" width="22" height="8" rx="2" fill="#ffffff" opacity="0.35" />
        <rect x="244" y="9" width="26" height="12" rx="2" fill={corDestaque} />
        {/* Hero */}
        <rect x="0" y="30" width="280" height="44" fill={corPrimaria} opacity="0.85" />
        <rect x="12" y="40" width="100" height="10" rx="2" fill="#ffffff" opacity="0.9" />
        <rect x="12" y="55" width="68" height="7" rx="2" fill="#ffffff" opacity="0.45" />
        <rect x="200" y="36" width="68" height="32" rx="4" fill={corDestaque} opacity="0.3" />
        {/* Cards */}
        {([10, 101, 192] as const).map((x) => (
          <g key={x}>
            <rect x={x} y="84" width="78" height="52" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x={x} y="84" width="78" height="28" rx="4" fill="#cbd5e1" />
            <rect x={x + 4} y="117" width="40" height="6" rx="2" fill={corPrimaria} opacity="0.65" />
            <rect x={x + 4} y="127" width="28" height="5" rx="2" fill={corDestaque} />
          </g>
        ))}
        <rect x="0" y="148" width="280" height="12" fill={corPrimaria} />
      </svg>
    );
  }

  if (tema === "MODERNO") {
    return (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden>
        <defs>
          <linearGradient id="grad-mod" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#09090b" stopOpacity="0.92" />
            <stop offset="55%" stopColor="#09090b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="280" height="160" fill="#09090b" />
        {/* Header */}
        <rect width="280" height="28" fill="#09090b" />
        <rect x="0" y="27" width="280" height="1" fill="#27272a" />
        <rect x="12" y="8" width="36" height="12" rx="2" fill={corDestaque} />
        <rect x="170" y="10" width="20" height="7" rx="2" fill="#52525b" />
        <rect x="196" y="10" width="20" height="7" rx="2" fill="#52525b" />
        <rect x="222" y="10" width="20" height="7" rx="2" fill="#52525b" />
        <rect x="248" y="8" width="22" height="11" rx="2" fill={corDestaque} />
        {/* Hero */}
        <rect x="0" y="28" width="280" height="56" fill="#18181b" />
        <rect x="0" y="28" width="280" height="56" fill="url(#grad-mod)" />
        <rect x="130" y="32" width="145" height="48" rx="3" fill="#27272a" />
        <rect x="12" y="36" width="90" height="11" rx="2" fill="#fafafa" opacity="0.9" />
        <rect x="12" y="52" width="64" height="7" rx="2" fill="#a1a1aa" />
        <rect x="12" y="65" width="50" height="12" rx="2" fill={corDestaque} />
        {/* Cards */}
        {([10, 101, 192] as const).map((x) => (
          <g key={x}>
            <rect x={x} y="94" width="78" height="48" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <rect x={x} y="94" width="78" height="26" rx="4" fill="#27272a" />
            <rect x={x + 4} y="125" width="38" height="5" rx="2" fill="#e4e4e7" />
            <rect x={x + 4} y="134" width="26" height="5" rx="2" fill={corDestaque} />
          </g>
        ))}
        <rect x="0" y="150" width="280" height="10" fill="#09090b" />
        <rect x="0" y="150" width="280" height="1" fill="#27272a" />
      </svg>
    );
  }

  // MINIMAL
  return (
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden>
      <rect width="280" height="160" fill="#ffffff" />
      {/* Header */}
      <rect width="280" height="24" fill="#ffffff" />
      <rect x="0" y="23" width="280" height="1" fill="#e5e7eb" />
      <rect x="12" y="8" width="52" height="8" rx="2" fill={corPrimaria} />
      <rect x="180" y="9" width="18" height="6" rx="2" fill="#d1d5db" />
      <rect x="204" y="9" width="18" height="6" rx="2" fill="#d1d5db" />
      <rect x="228" y="9" width="18" height="6" rx="2" fill="#d1d5db" />
      <rect x="252" y="7" width="20" height="10" rx="5" fill={corPrimaria} />
      {/* Hero */}
      <rect x="0" y="24" width="280" height="40" fill="#f9fafb" />
      <rect x="60" y="32" width="160" height="10" rx="2" fill={corPrimaria} opacity="0.8" />
      <rect x="90" y="47" width="100" height="6" rx="2" fill="#9ca3af" />
      <rect x="120" y="60" width="40" height="1" fill="#e5e7eb" />
      {/* Filter */}
      <rect x="10" y="68" width="260" height="14" rx="7" fill="#f3f4f6" />
      <rect x="16" y="72" width="36" height="6" rx="3" fill="#d1d5db" />
      <rect x="60" y="72" width="36" height="6" rx="3" fill="#d1d5db" />
      <rect x="104" y="72" width="36" height="6" rx="3" fill={corDestaque} opacity="0.55" />
      {/* Cards 4-col */}
      {([10, 74, 138, 202] as const).map((x, i) => (
        <g key={x}>
          <rect x={x} y="88" width={i === 3 ? 68 : 58} height="48" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
          <rect x={x} y="88" width={i === 3 ? 68 : 58} height="26" rx="3" fill="#f3f4f6" />
          <rect x={x + 3} y="119" width="30" height="5" rx="2" fill={corPrimaria} opacity="0.55" />
          <rect x={x + 3} y="128" width="20" height="4" rx="2" fill={corDestaque} opacity="0.65" />
        </g>
      ))}
      <rect x="0" y="148" width="280" height="12" fill="#ffffff" />
      <rect x="0" y="148" width="280" height="1" fill="#e5e7eb" />
      <rect x="110" y="153" width="60" height="4" rx="2" fill="#d1d5db" />
    </svg>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({
  label, name, defaultValue, placeholder, maxLength, className, onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  onChange?: () => void;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="text" name={name} defaultValue={defaultValue} placeholder={placeholder}
        maxLength={maxLength} onChange={onChange}
        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function Textarea({
  label, name, defaultValue, placeholder, rows, onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
  onChange?: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea name={name} defaultValue={defaultValue} placeholder={placeholder}
        rows={rows ?? 3} onChange={onChange}
        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
    </div>
  );
}
