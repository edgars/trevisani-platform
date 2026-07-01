import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const FOTOS_BUCKET = "veiculos-fotos";

let _client: SupabaseClient | null = null;

/** Lazy init — lança erro descritivo apenas quando o storage é efetivamente usado */
function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local para usar o storage de fotos.",
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** Retorna a URL pública de um path no bucket */
export function getPublicUrl(storagePath: string): string {
  const { data } = getClient().storage.from(FOTOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Faz upload de um Buffer e retorna o storagePath */
export async function uploadFoto(
  tenantId: string,
  veiculoId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const storagePath = `${tenantId}/${veiculoId}/${Date.now()}.${ext}`;
  const { error } = await getClient()
    .storage.from(FOTOS_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Supabase upload: ${error.message}`);
  return storagePath;
}

/** Remove um arquivo do bucket */
export async function deleteFoto(storagePath: string): Promise<void> {
  const { error } = await getClient().storage.from(FOTOS_BUCKET).remove([storagePath]);
  if (error) throw new Error(`Supabase delete: ${error.message}`);
}
