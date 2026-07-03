import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { atualizarStorageTenant } from "@/lib/tracking/eventos";

export const FOTOS_BUCKET  = "veiculos-fotos";
export const DOCS_BUCKET   = "veiculos-docs";
export const GERAIS_BUCKET = "arquivos-gerais";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** URL pública — apenas para buckets públicos (ex: fotos de vitrine) */
export function getPublicUrl(bucket: string, storagePath: string): string {
  const { data } = getClient().storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Gera uma Signed URL temporária para buckets privados.
 * @param expiresIn - Segundos até expirar (padrão: 3600 = 1h)
 */
export async function gerarUrlAssinada(
  bucket: string,
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(bucket)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed URL: ${error?.message ?? "sem retorno"}`);
  }
  return data.signedUrl;
}

export async function uploadArquivo(
  bucket: string,
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Supabase upload: ${error.message}`);
  return storagePath;
}

export async function deletarArquivo(bucket: string, storagePath: string): Promise<void> {
  const { error } = await getClient().storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Supabase delete: ${error.message}`);
}

// ─── Atalhos para fotos ───────────────────────────────────────────────────────

export async function uploadFoto(
  tenantId: string,
  veiculoId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const path = `${tenantId}/${veiculoId}/${Date.now()}.${ext}`;
  await uploadArquivo(FOTOS_BUCKET, path, buffer, contentType);
  atualizarStorageTenant(tenantId, buffer.length);
  return path;
}

export async function deleteFoto(storagePath: string): Promise<void> {
  return deletarArquivo(FOTOS_BUCKET, storagePath);
}

export async function uploadFotoChecklist(
  tenantId: string,
  veiculoId: string,
  checklistId: string,
  itemId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const path = `checklists/${veiculoId}/${checklistId}/${itemId}/${Date.now()}.${ext}`;
  await uploadArquivo(GERAIS_BUCKET, path, buffer, contentType);
  atualizarStorageTenant(tenantId, buffer.length);
  return path;
}

// ─── Logo do tenant ───────────────────────────────────────────────────────────

/**
 * Faz upload da logo do tenant para o bucket "arquivos-gerais".
 * Usa upsert para sobrescrever automaticamente a logo anterior.
 * Path: logos/{tenantId}/logo.{ext}
 */
export async function uploadLogoTenant(
  tenantId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const client = getClient();

  // Cria o bucket se ainda não existir (idempotente).
  await client.storage.createBucket(GERAIS_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
    fileSizeLimit: 2 * 1024 * 1024, // 2 MB
  }).catch(() => {}); // ignora se já existir

  const storagePath = `logos/${tenantId}/logo.${ext}`;

  const { error } = await client.storage
    .from(GERAIS_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Upload logo: ${error.message}`);
  atualizarStorageTenant(tenantId, buffer.length);
  return storagePath;
}
