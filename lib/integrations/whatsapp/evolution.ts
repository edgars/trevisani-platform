/**
 * Evolution API client.
 * Each tenant has one "instance" = one connected WhatsApp number.
 *
 * Docs: https://doc.evolution-api.com
 *
 * Env vars required:
 *   WHATSAPP_API_URL  — base URL of your Evolution API server
 *   WHATSAPP_API_KEY  — global API key (set in Evolution API config)
 */

export interface EvolutionInstance {
  instanceName: string;
  status: "open" | "close" | "connecting";
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
}

export interface QrCodeData {
  qrcode: string;     // base64 PNG  (data:image/png;base64,...)
  pairingCode?: string;
  count?: number;
}

function baseUrl(): string {
  const url = process.env.WHATSAPP_API_URL;
  if (!url) throw new Error("WHATSAPP_API_URL não configurado.");
  return url.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const key = process.env.WHATSAPP_API_KEY;
  if (!key) throw new Error("WHATSAPP_API_KEY não configurado.");
  return { "Content-Type": "application/json", apikey: key };
}

async function evFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Instâncias ──────────────────────────────────────────────────────────────

/** Cria uma nova instância. Idempotente — retorna ok se já existir. */
export async function criarInstancia(
  instanceName: string,
  webhookUrl: string,
  webhookSecret: string,
): Promise<void> {
  await evFetch("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        url:     webhookUrl,
        byEvents: true,
        base64:  false,
        headers: { "x-webhook-secret": webhookSecret },
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "CONNECTION_UPDATE",
          "QRCODE_UPDATED",
          "CONTACTS_UPSERT",
        ],
      },
    }),
  }).catch((err) => {
    // Ignora erro se instância já existe
    if (!String(err).includes("already")) throw err;
  });
}

/** Retorna o QR code para conectar. Chamar depois de criarInstancia(). */
export async function obterQrCode(instanceName: string): Promise<QrCodeData> {
  return evFetch<{ qrcode: QrCodeData }>(`/instance/connect/${instanceName}`)
    .then((r) => r.qrcode);
}

/** Status atual da instância. */
export async function statusInstancia(instanceName: string): Promise<EvolutionInstance | null> {
  try {
    const data = await evFetch<{ instance: EvolutionInstance }>(
      `/instance/fetchInstances?instanceName=${instanceName}`,
    );
    return data.instance ?? null;
  } catch {
    return null;
  }
}

/** Desconecta o WhatsApp mas mantém a instância. */
export async function desconectarInstancia(instanceName: string): Promise<void> {
  await evFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
}

/** Remove a instância completamente. */
export async function deletarInstancia(instanceName: string): Promise<void> {
  await evFetch(`/instance/delete/${instanceName}`, { method: "DELETE" });
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

/** Envia mensagem de texto simples. */
export async function enviarTexto(
  instanceName: string,
  to: string,         // "5511999998888" ou "5511999998888@s.whatsapp.net"
  text: string,
): Promise<{ key: { id: string } }> {
  const number = to.includes("@") ? to : `${to}@s.whatsapp.net`;
  return evFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number, text }),
  });
}

/** Envia imagem com legenda opcional. */
export async function enviarImagem(
  instanceName: string,
  to: string,
  imageUrl: string,
  caption?: string,
): Promise<{ key: { id: string } }> {
  const number = to.includes("@") ? to : `${to}@s.whatsapp.net`;
  return evFetch(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number,
      mediatype: "image",
      media: imageUrl,
      caption: caption ?? "",
    }),
  });
}

/** Marca mensagens como lidas. */
export async function marcarComoLido(
  instanceName: string,
  remoteJid: string,
  messageIds: string[],
): Promise<void> {
  await evFetch(`/chat/markMessageAsRead/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      readMessages: messageIds.map((id) => ({
        id,
        fromMe: false,
        remoteJid,
      })),
    }),
  }).catch(() => {}); // silencia — não crítico
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai número limpo do JID. Ex: "5511999998888@s.whatsapp.net" → "5511999998888" */
export function jidParaNumero(jid: string): string {
  return jid.split("@")[0];
}

/** Formata número BR para exibição. Ex: "5511999998888" → "+55 (11) 99999-8888" */
export function formatarNumero(numero: string): string {
  const n = numero.replace(/\D/g, "");
  if (n.length === 13) {
    // +55 (XX) 9XXXX-XXXX
    return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
  }
  if (n.length === 12) {
    return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 8)}-${n.slice(8)}`;
  }
  return `+${n}`;
}
