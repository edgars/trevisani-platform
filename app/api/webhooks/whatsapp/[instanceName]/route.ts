/**
 * Webhook receiver for Evolution API events.
 * URL registered per tenant: /api/webhooks/whatsapp/{instanceName}
 *
 * `instanceName` = `loja-{tenantId}` (ver lib/integrations/whatsapp/evolution.ts).
 * Usamos o tenantId (imutável) em vez do slug da loja para que trocar o
 * endereço da vitrine não quebre uma conexão de WhatsApp já ativa.
 *
 * Events handled:
 *   MESSAGES_UPSERT    — new messages received or sent
 *   MESSAGES_UPDATE    — message status update (read, delivered)
 *   CONNECTION_UPDATE  — WhatsApp connection state change
 *   QRCODE_UPDATED     — new QR code emitted
 *   CONTACTS_UPSERT    — contact info update
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// ─── Types from Evolution API webhook payload ────────────────────────────────

interface EvolutionWebhookPayload {
  event:        string;
  instance:     string;
  data:         Record<string, unknown>;
  apikey?:      string;
}

interface MessageData {
  key: {
    remoteJid: string;
    remoteJidAlt?: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string; url?: string; mimetype?: string };
    audioMessage?: { url?: string; mimetype?: string };
    documentMessage?: { url?: string; mimetype?: string; title?: string };
    stickerMessage?: { url?: string };
  };
  pushName?: string;
  messageTimestamp?: number;
  status?: string;
}

interface ConnectionData {
  state: "open" | "close" | "connecting";
  statusReason?: number;
  number?: string;
}

interface QrCodeData {
  qrcode?: {
    qrcode?: string;
    pairingCode?: string;
  };
}

function extrairMensagens(raw: unknown): MessageData[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as MessageData[];

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (obj.key) return [obj as unknown as MessageData];
    if (Array.isArray(obj.messages)) return obj.messages as MessageData[];
    if (Array.isArray(obj.updates)) return obj.updates as MessageData[];
    if (obj.data && Array.isArray(obj.data)) return obj.data as MessageData[];
    if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (dataObj.key) return [dataObj as unknown as MessageData];
      if (Array.isArray(dataObj.messages)) return dataObj.messages as MessageData[];
      if (Array.isArray(dataObj.updates)) return dataObj.updates as MessageData[];
    }
    if (obj.message && typeof obj.message === "object" && (obj.message as Record<string, unknown>).key) {
      return [obj.message as unknown as MessageData];
    }
  }

  return [];
}

function extrairContatos(raw: unknown): { id: string; pushName?: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as { id: string; pushName?: string }[];

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.contacts)) return obj.contacts as { id: string; pushName?: string }[];
    if (Array.isArray(obj.data)) return obj.data as { id: string; pushName?: string }[];
    if (typeof obj.id === "string") return [obj as { id: string; pushName?: string }];
  }

  return [];
}

function extrairConnectionData(raw: unknown): ConnectionData | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.state === "string") return obj as unknown as ConnectionData;
  if (obj.instance && typeof obj.instance === "object") {
    const instance = obj.instance as Record<string, unknown>;
    if (typeof instance.state === "string") return instance as unknown as ConnectionData;
  }
  return null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> },
) {
  const { instanceName } = await params;

  const payload = await req.json().catch(() => null) as EvolutionWebhookPayload | null;
  if (!payload) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  // Verify secret
  const secret = req.headers.get("x-webhook-secret");
  const integracao = await prisma.integracaoWhatsApp.findFirst({
    where: { instanceName },
    select: { id: true, tenantId: true, webhookSecret: true, status: true, criarLeadAuto: true },
  });

  if (!integracao) {
    return NextResponse.json({ error: "unknown instance" }, { status: 404 });
  }
  if (secret !== integracao.webhookSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { event, data } = payload;

  try {
    switch (event) {
      case "MESSAGES_UPSERT": {
        const mensagens = extrairMensagens(data);
        for (const msg of mensagens) {
          await handleMessagesUpsert(integracao.id, integracao.tenantId, integracao.criarLeadAuto, msg);
        }
        break;
      }

      case "MESSAGES_UPDATE": {
        const mensagens = extrairMensagens(data);
        for (const msg of mensagens) {
          await handleMessagesUpdate(integracao.id, msg);
        }
        break;
      }

      case "CONNECTION_UPDATE": {
        const conn = extrairConnectionData(data);
        if (conn) await handleConnectionUpdate(integracao.id, conn);
        break;
      }

      case "QRCODE_UPDATED":
        await handleQrCodeUpdated(integracao.id, data as unknown as QrCodeData);
        break;

      case "CONTACTS_UPSERT": {
        const contatos = extrairContatos(data);
        await handleContactsUpsert(integracao.id, contatos);
        break;
      }

      default:
        // Unknown event — ignore silently
        break;
    }
  } catch (err) {
    console.error(`[WPP webhook] ${instanceName} ${event}`, err);
    // Always return 200 to prevent Evolution API from retrying indefinitely
  }

  return NextResponse.json({ ok: true });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleMessagesUpsert(
  integracaoId: string,
  tenantId: string,
  criarLeadAuto: boolean,
  data: MessageData,
) {
  const { key, message, pushName, messageTimestamp } = data;
  if (!key?.remoteJid) return;
  const status = (data.status ?? "").toUpperCase();
  const canonicalRemoteJid =
    key.remoteJidAlt?.endsWith("@s.whatsapp.net")
      ? key.remoteJidAlt
      : key.remoteJid;
  const numeroCanonico = canonicalRemoteJid.split("@")[0]?.replace(/\D/g, "") ?? "";

  // Ignore group messages (JIDs ending with @g.us) and status broadcasts
  if (canonicalRemoteJid.endsWith("@g.us")) return;
  if (canonicalRemoteJid === "status@broadcast") return;
  if (!numeroCanonico || numeroCanonico === "0" || numeroCanonico.length < 8) return;

  const timestamp = messageTimestamp
    ? new Date(messageTimestamp * 1000)
    : new Date();

  // Detect message content and type
  let corpo: string | null = null;
  let tipo = "text";
  let mediaUrl: string | null = null;
  let mimetype: string | null = null;

  if (message?.conversation) {
    corpo = message.conversation;
  } else if (message?.extendedTextMessage?.text) {
    corpo = message.extendedTextMessage.text;
  } else if (message?.imageMessage) {
    tipo     = "image";
    corpo    = message.imageMessage.caption ?? null;
    mediaUrl = message.imageMessage.url ?? null;
    mimetype = message.imageMessage.mimetype ?? null;
  } else if (message?.audioMessage) {
    tipo     = "audio";
    mediaUrl = message.audioMessage.url ?? null;
    mimetype = message.audioMessage.mimetype ?? null;
  } else if (message?.documentMessage) {
    tipo     = "document";
    corpo    = message.documentMessage.title ?? null;
    mediaUrl = message.documentMessage.url ?? null;
    mimetype = message.documentMessage.mimetype ?? null;
  } else if (message?.stickerMessage) {
    tipo     = "sticker";
    mediaUrl = message.stickerMessage.url ?? null;
  }

  // Upsert conversa (sem clienteId por enquanto)
  const conversa = await prisma.conversaWpp.upsert({
    where:  { integracaoId_remoteJid: { integracaoId, remoteJid: canonicalRemoteJid } },
    update: {
      ultimaMensagem: timestamp,
      nomeContato:    pushName ?? undefined,
    },
    create: {
      integracaoId,
      remoteJid:      canonicalRemoteJid,
      nomeContato:    pushName ?? null,
      ultimaMensagem: timestamp,
      totalNaoLidas:  0,
    },
    select: { id: true, clienteId: true },
  });

  // Vincula/cria ClienteFinal somente para mensagens recebidas (não enviadas pela loja)
  if (!key.fromMe && !conversa.clienteId) {
    const numero = canonicalRemoteJid.split("@")[0];
    // Últimos 8 dígitos para tolerar DDI/DDD variados no campo telefone
    const sufixo = numero.slice(-8);

    const clienteExistente = await prisma.clienteFinal.findFirst({
      where:  { tenantId, telefone: { contains: sufixo } },
      select: { id: true },
    });

    if (clienteExistente) {
      // Vincula ao cliente já existente
      await prisma.conversaWpp.update({
        where: { id: conversa.id },
        data:  { clienteId: clienteExistente.id },
      });
    } else if (criarLeadAuto) {
      // Cria novo lead automaticamente
      const nomeWpp = pushName?.trim();
      const novoCliente = await prisma.clienteFinal.create({
        data: {
          tenantId,
          tipoPessoa: "PF",
          nome:       nomeWpp && nomeWpp.length > 0 ? nomeWpp : `WhatsApp ${numero}`,
          telefone:   numero,
          documento:  `wpp:${numero}`, // placeholder — editável pelo lojista depois
          tags:       ["lead-whatsapp"],
        },
        select: { id: true },
      });

      await prisma.conversaWpp.update({
        where: { id: conversa.id },
        data:  { clienteId: novoCliente.id },
      });

      console.info(`[WPP] Lead criado automaticamente: ${novoCliente.id} (${numero})`);
    }
  }

  const msgExistente = await prisma.mensagemWpp.findUnique({
    where: { conversaId_messageId: { conversaId: conversa.id, messageId: key.id } },
    select: { id: true },
  });

  if (!msgExistente) {
    await prisma.mensagemWpp.create({
      data: {
        conversaId: conversa.id,
        messageId:  key.id,
        fromMe:     key.fromMe,
        tipo,
        corpo,
        mediaUrl,
        mimetype,
        lida:       key.fromMe ? status === "READ" || status === "PLAYED" : false,
        timestamp,
      },
    });

    if (!key.fromMe) {
      await prisma.conversaWpp.update({
        where: { id: conversa.id },
        data: { totalNaoLidas: { increment: 1 } },
      });
    }
  }
}

async function handleMessagesUpdate(integracaoId: string, data: MessageData) {
  const { key } = data;
  const status = (data.status ?? "").toUpperCase();
  if (!key?.remoteJid || !status) return;
  const canonicalRemoteJid =
    key.remoteJidAlt?.endsWith("@s.whatsapp.net")
      ? key.remoteJidAlt
      : key.remoteJid;

  if (status === "READ" || status === "PLAYED") {
    const conversa = await prisma.conversaWpp.findUnique({
      where:  { integracaoId_remoteJid: { integracaoId, remoteJid: canonicalRemoteJid } },
      select: { id: true },
    });
    if (conversa) {
      await prisma.mensagemWpp.updateMany({
        where: { conversaId: conversa.id, messageId: key.id },
        data:  { lida: true },
      });
    }
  }
}

async function handleConnectionUpdate(integracaoId: string, data: ConnectionData) {
  const { state, number } = data;

  const statusMap: Record<string, string> = {
    open:       "CONECTADO",
    close:      "DESCONECTADO",
    connecting: "AGUARDANDO_QR",
  };
  const novoStatus = statusMap[state] ?? "ERRO";

  await prisma.integracaoWhatsApp.update({
    where: { id: integracaoId },
    data: {
      status:          novoStatus as "CONECTADO" | "DESCONECTADO" | "AGUARDANDO_QR" | "ERRO",
      numeroConectado: state === "open" ? (number ?? null) : null,
      qrCode:          state === "open" ? null : undefined,
    },
  });
}

async function handleQrCodeUpdated(integracaoId: string, data: QrCodeData) {
  const qr = data?.qrcode?.qrcode;
  if (!qr) return;

  await prisma.integracaoWhatsApp.update({
    where: { id: integracaoId },
    data: {
      qrCode:      qr,
      qrExpiresAt: new Date(Date.now() + 60_000),
      status:      "AGUARDANDO_QR",
    },
  });
}

async function handleContactsUpsert(integracaoId: string, contacts: { id: string; pushName?: string }[]) {
  for (const c of contacts) {
    if (!c.id || !c.pushName) continue;
    await prisma.conversaWpp.updateMany({
      where: { integracaoId, remoteJid: c.id },
      data:  { nomeContato: c.pushName },
    });
  }
}
