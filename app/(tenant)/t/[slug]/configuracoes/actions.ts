"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import {
  GERAIS_BUCKET,
  getPublicUrl,
  uploadLogoTenant,
} from "@/lib/storage/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizarCnpj(v: string) {
  return v.replace(/\D/g, "");
}

function validarCnpj(cnpj: string) {
  const n = cnpj.replace(/\D/g, "");
  if (n.length !== 14) return false;
  if (/^(\d)\1+$/.test(n)) return false;
  const calc = (mod: number) => {
    let sum = 0;
    let pos = mod - 7;
    for (let i = mod; i >= 1; i--) {
      sum += parseInt(n.charAt(mod - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return r === parseInt(n.charAt(mod));
  };
  return calc(12) && calc(13);
}

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const LOGO_VALID_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif":  "gif",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const perfilSchema = z.object({
  nome: z.string().min(2, "Nome da loja deve ter ao menos 2 caracteres."),
  razaoSocial: z.string().optional(),
  cnpj: z
    .string()
    .optional()
    .transform((v) => (v ? normalizarCnpj(v) : ""))
    .refine((v) => !v || validarCnpj(v), "CNPJ inválido."),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  dominio: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v),
      "Domínio inválido (ex: minharevenda.com.br).",
    ),
  logoUrl: z.string().url("URL inválida.").optional().or(z.literal("")),
});

export type PerfilFormData = z.input<typeof perfilSchema>;
export type PerfilActionResult =
  | { ok: true; logoUrl?: string }
  | { ok: false; errors: Record<string, string[]> };

// ─── Action ───────────────────────────────────────────────────────────────────

export async function atualizarPerfilTenantAction(
  slug: string,
  _prev: PerfilActionResult | null,
  formData: FormData,
): Promise<PerfilActionResult> {
  const session = await requireSession();
  const tenant = await requireTenantPorSlug(slug);

  if (
    session.user.escopo !== "PLATAFORMA" &&
    session.user.tenantId !== tenant.id
  ) {
    return { ok: false, errors: { _: ["Sem permissão para editar este tenant."] } };
  }

  // ── 1. Processar upload da logo (se houver arquivo) ───────────────────────
  let finalLogoUrl = (formData.get("logoUrl") as string | null)?.trim() ?? tenant.logoUrl ?? "";

  const logoFile = formData.get("logoFile") as File | null;
  if (logoFile && logoFile.size > 0) {
    if (!LOGO_VALID_TYPES[logoFile.type]) {
      return {
        ok: false,
        errors: { logo: ["Formato inválido. Envie JPG, PNG, WebP, SVG ou GIF."] },
      };
    }
    if (logoFile.size > LOGO_MAX_BYTES) {
      return {
        ok: false,
        errors: { logo: ["Arquivo muito grande. Máximo permitido: 2 MB."] },
      };
    }

    const ext = LOGO_VALID_TYPES[logoFile.type];
    const buffer = Buffer.from(await logoFile.arrayBuffer());

    try {
      const storagePath = await uploadLogoTenant(tenant.id, buffer, logoFile.type, ext);
      finalLogoUrl = getPublicUrl(GERAIS_BUCKET, storagePath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      return { ok: false, errors: { logo: [`Falha no upload: ${msg}`] } };
    }
  }

  // ── 2. Validar campos de texto ────────────────────────────────────────────
  const raw = {
    nome:       formData.get("nome") ?? "",
    razaoSocial: formData.get("razaoSocial") ?? "",
    cnpj:       formData.get("cnpj") ?? "",
    telefone:   formData.get("telefone") ?? "",
    email:      formData.get("email") ?? "",
    dominio:    formData.get("dominio") ?? "",
    logoUrl:    finalLogoUrl,
  };

  const parsed = perfilSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { nome, razaoSocial, cnpj, dominio } = parsed.data;

  const configAtual = (tenant.configJson as Record<string, unknown>) ?? {};
  const configJson = {
    ...configAtual,
    telefone:     (raw.telefone as string).trim() || null,
    emailContato: (raw.email as string).trim() || null,
  };

  // ── 3. Persistir ─────────────────────────────────────────────────────────
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      nome:       nome.trim(),
      razaoSocial: razaoSocial?.trim() || null,
      cnpj:       cnpj || null,
      dominio:    dominio?.trim() || null,
      logoUrl:    finalLogoUrl || null,
      configJson,
    },
  });

  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/configuracoes`);

  return { ok: true, logoUrl: finalLogoUrl || undefined };
}
