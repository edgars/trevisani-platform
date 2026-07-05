import { prisma } from "@/lib/db/client";
import { listarChats, listarMensagens, type EvolutionChat, type EvolutionMessage } from "./evolution";

function extrairCorpo(chat: EvolutionChat): string | null {
  const m = chat.lastMessage?.message;
  if (!m) return null;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.documentMessage?.title ??
    null
  );
}

function normalizarTipo(tipo?: string): string {
  if (!tipo) return "text";
  if (tipo === "conversation") return "text";
  if (tipo.toLowerCase().includes("image")) return "image";
  if (tipo.toLowerCase().includes("audio")) return "audio";
  if (tipo.toLowerCase().includes("document")) return "document";
  if (tipo.toLowerCase().includes("sticker")) return "sticker";
  return "text";
}

function extrairCorpoMensagem(msg: EvolutionMessage): string | null {
  const m = msg.message;
  if (!m) return null;
  return (
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.documentMessage?.title ??
    null
  );
}

/**
 * Sincroniza conversas existentes da Evolution API para o inbox local.
 * Útil para "bootstrap" quando o webhook ficou indisponível por um período.
 */
export async function sincronizarInboxDaInstancia(params: {
  integracaoId: string;
  instanceName: string;
}): Promise<{ conversasCriadas: number; mensagensCriadas: number }> {
  const { integracaoId, instanceName } = params;
  const chats = await listarChats(instanceName, 120);

  let conversasCriadas = 0;
  let mensagensCriadas = 0;

  for (const chat of chats) {
    const remoteJid = chat.remoteJid;
    if (!remoteJid) continue;
    if (remoteJid === "status@broadcast") continue;
    if (remoteJid.endsWith("@g.us")) continue;

    const timestampSec = chat.lastMessage?.messageTimestamp;
    const ultimaMensagem = timestampSec
      ? new Date(timestampSec * 1000)
      : chat.updatedAt
        ? new Date(chat.updatedAt)
        : new Date();

    const existed = await prisma.conversaWpp.findUnique({
      where: { integracaoId_remoteJid: { integracaoId, remoteJid } },
      select: { id: true },
    });

    const conversa = await prisma.conversaWpp.upsert({
      where: { integracaoId_remoteJid: { integracaoId, remoteJid } },
      update: {
        nomeContato: chat.pushName ?? undefined,
        totalNaoLidas: typeof chat.unreadCount === "number" ? Math.max(chat.unreadCount, 0) : undefined,
        ultimaMensagem,
      },
      create: {
        integracaoId,
        remoteJid,
        nomeContato: chat.pushName ?? null,
        totalNaoLidas: typeof chat.unreadCount === "number" ? Math.max(chat.unreadCount, 0) : 0,
        ultimaMensagem,
      },
      select: { id: true },
    });
    if (!existed) conversasCriadas += 1;

    const key = chat.lastMessage?.key;
    if (!key?.id) continue;

    const msgExiste = await prisma.mensagemWpp.findUnique({
      where: { conversaId_messageId: { conversaId: conversa.id, messageId: key.id } },
      select: { id: true },
    });
    if (msgExiste) continue;

    await prisma.mensagemWpp.create({
      data: {
        conversaId: conversa.id,
        messageId: key.id,
        fromMe: !!key.fromMe,
        tipo: normalizarTipo(chat.lastMessage?.messageType),
        corpo: extrairCorpo(chat),
        timestamp: ultimaMensagem,
        lida: !!key.fromMe || (typeof chat.unreadCount === "number" ? chat.unreadCount === 0 : false),
      },
    });
    mensagensCriadas += 1;
  }

  return { conversasCriadas, mensagensCriadas };
}

/** Sincroniza mensagens da conversa direto da Evolution (fallback ao webhook). */
export async function sincronizarConversaDaInstancia(params: {
  integracaoId: string;
  instanceName: string;
  remoteJid: string;
}): Promise<{ mensagensCriadas: number }> {
  const { integracaoId, instanceName, remoteJid } = params;
  const mensagens = await listarMensagens(instanceName, remoteJid, 180);
  if (mensagens.length === 0) return { mensagensCriadas: 0 };

  const conversa = await prisma.conversaWpp.upsert({
    where: { integracaoId_remoteJid: { integracaoId, remoteJid } },
    update: {},
    create: {
      integracaoId,
      remoteJid,
      totalNaoLidas: 0,
      ultimaMensagem: new Date(),
    },
    select: { id: true },
  });

  let mensagensCriadas = 0;
  let ultimoTs: Date | null = null;

  for (const msg of mensagens) {
    const messageId = msg.key?.id;
    if (!messageId) continue;
    const fromMe = !!msg.key?.fromMe;
    const ts = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();
    if (!ultimoTs || ts > ultimoTs) ultimoTs = ts;

    const existente = await prisma.mensagemWpp.findUnique({
      where: { conversaId_messageId: { conversaId: conversa.id, messageId } },
      select: { id: true },
    });
    if (existente) continue;

    await prisma.mensagemWpp.create({
      data: {
        conversaId: conversa.id,
        messageId,
        fromMe,
        tipo: normalizarTipo(msg.messageType),
        corpo: extrairCorpoMensagem(msg),
        mediaUrl:
          msg.message?.imageMessage?.url ??
          msg.message?.audioMessage?.url ??
          msg.message?.documentMessage?.url ??
          msg.message?.stickerMessage?.url ??
          null,
        mimetype:
          msg.message?.imageMessage?.mimetype ??
          msg.message?.audioMessage?.mimetype ??
          msg.message?.documentMessage?.mimetype ??
          null,
        timestamp: ts,
        lida: fromMe ? (msg.status?.toUpperCase() === "READ" || msg.status?.toUpperCase() === "PLAYED") : false,
      },
    });
    mensagensCriadas += 1;
  }

  if (ultimoTs) {
    const unread = await prisma.mensagemWpp.count({
      where: { conversaId: conversa.id, fromMe: false, lida: false },
    });
    await prisma.conversaWpp.update({
      where: { id: conversa.id },
      data: { ultimaMensagem: ultimoTs, totalNaoLidas: unread },
    });
  }

  return { mensagensCriadas };
}

