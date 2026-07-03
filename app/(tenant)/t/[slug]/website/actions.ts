"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import {
  uploadArquivo,
  getPublicUrl,
  FOTOS_BUCKET,
} from "@/lib/storage/supabase";

const WEBSITE_BUCKET = FOTOS_BUCKET; // reutiliza o mesmo bucket; pasta separada
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB para logos

// ─── Salvar configurações de identidade e conteúdo ───────────────────────────

const websiteSchema = z.object({
  tema: z.enum(["CLASSICO", "MODERNO", "MINIMAL"]),
  fonte: z.enum(["INTER", "POPPINS", "ROBOTO", "LATO", "MONTSERRAT"]),
  corPrimaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  corDestaque: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
  heroTitulo: z.string().max(120).optional().or(z.literal("")),
  heroSubtitulo: z.string().max(240).optional().or(z.literal("")),
  sobre: z.string().max(2000).optional().or(z.literal("")),
  telefone: z.string().max(30).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  endereco: z.string().max(200).optional().or(z.literal("")),
  instagram: z.string().max(60).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  youtube: z.string().max(200).optional().or(z.literal("")),
  tiktok: z.string().max(200).optional().or(z.literal("")),
  linkedin: z.string().max(200).optional().or(z.literal("")),
  x: z.string().max(200).optional().or(z.literal("")),
  seoTitulo: z.string().max(70).optional().or(z.literal("")),
  seoDescricao: z.string().max(160).optional().or(z.literal("")),
  publicado: z.boolean(),
});

export type WebsiteFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function salvarWebsite(
  slug: string,
  _prev: WebsiteFormState,
  formData: FormData,
): Promise<WebsiteFormState> {
  const session = await requireSession();
  const tenant = await requireTenantPorSlug(slug);

  if (session.user.tenantId !== tenant.id && session.user.escopo !== "PLATAFORMA") {
    return { status: "error", message: "Sem permissão." };
  }

  const raw = {
    tema: formData.get("tema"),
    fonte: formData.get("fonte"),
    corPrimaria: formData.get("corPrimaria"),
    corDestaque: formData.get("corDestaque"),
    heroTitulo: formData.get("heroTitulo") ?? "",
    heroSubtitulo: formData.get("heroSubtitulo") ?? "",
    sobre: formData.get("sobre") ?? "",
    telefone: formData.get("telefone") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    endereco: formData.get("endereco") ?? "",
    instagram: formData.get("instagram") ?? "",
    facebook: formData.get("facebook") ?? "",
    youtube: formData.get("youtube") ?? "",
    tiktok: formData.get("tiktok") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    x: formData.get("x") ?? "",
    seoTitulo: formData.get("seoTitulo") ?? "",
    seoDescricao: formData.get("seoDescricao") ?? "",
    publicado: formData.get("publicado") === "true",
  };

  const parsed = websiteSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { status: "error", message: first ?? "Dados inválidos." };
  }

  const { publicado, ...data } = parsed.data;

  await prisma.websiteConfig.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      publicado,
      ...data,
    },
    update: {
      publicado,
      ...data,
    },
  });

  revalidatePath(`/t/${slug}/website`);

  return { status: "success", message: "Configurações salvas com sucesso!" };
}

// ─── Upload de logo ───────────────────────────────────────────────────────────

export async function uploadLogo(slug: string, formData: FormData): Promise<
  { success: true; url: string } | { success: false; error: string }
> {
  const session = await requireSession();
  const tenant = await requireTenantPorSlug(slug);

  if (session.user.tenantId !== tenant.id && session.user.escopo !== "PLATAFORMA") {
    return { success: false, error: "Sem permissão." };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "Nenhum arquivo enviado." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return { success: false, error: "Formato inválido. Use JPG, PNG, WEBP ou SVG." };
  if (file.size > MAX_BYTES)
    return { success: false, error: "Arquivo muito grande (máx 2 MB)." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const storagePath = `${tenant.id}/website/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadArquivo(WEBSITE_BUCKET, storagePath, buffer, file.type);
  } catch {
    // Tenta com upsert (arquivo já existe)
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { error } = await supabase.storage
      .from(WEBSITE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });
    if (error) return { success: false, error: `Upload falhou: ${error.message}` };
  }

  const url = getPublicUrl(WEBSITE_BUCKET, storagePath);

  await prisma.websiteConfig.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, logoUrl: url },
    update: { logoUrl: url },
  });

  revalidatePath(`/t/${slug}/website`);
  return { success: true, url };
}
