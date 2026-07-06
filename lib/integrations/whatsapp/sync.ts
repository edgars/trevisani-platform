import { prisma } from "@/lib/db/client";
import {
  jidCanonico,
  listarChats,
  listarTodasMensagens,
  type EvolutionMessage,
} from "./evolution";

/**
 * Sincronização pull-based com a Evolution API.
 *
 * A Evolution é a fonte de verdade: puxamos os chats (nome/foto) e as
 * mensagens recentes da instância inteira, agrupamos por JID canônico
 * (unificando `@lid` ↔ `@s.whatsapp.net` via `remoteJidAlt`) e refletimos
 * tudo no banco local. O webhook continua ativo, mas apenas como acelerador —
 * se ele falhar ou entregar formato inesperado, o sync corrige em segundos.
 */

function jidValidoParaInbox(remoteJid: string): boolean {
  if (!remoteJid) return false;
  if (remoteJid === "status@broadcast") return false;
  if (remoteJid.endsWith("@g.us")) return false;
  const numero = remoteJid.split("@")[0]?.replace(/\D/g, "") ?? "";
  if (!numero || numero === "0") return false;
  return numero.length >= 8;
}

function normalizarTipo(tipo?: string): string {
  if (!tipo) return "text";
  const t = tipo.toLowerCase();
  if (t === "conversation" || t.includes("extendedtext")) return "text";
  if (t.includes("image")) return "image";
  if (t.includes("audio")) return "audio";
  if (t.includes("document")) return "document";
  if (t.includes("sticker")) return "sticker";
  return "text";
}

function extrairCorpo(msg: EvolutionMessage): string | null {
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

function extrairMedia(msg: EvolutionMessage): { mediaUrl: string | null; mimetype: string | null } {
  const m = msg.message;
  return {
    mediaUrl:
      m?.imageMessage?.url ??
      m?.audioMessage?.url ??
      m?.documentMessage?.url ??
      m?.stickerMessage?.url ??
      null,
    mimetype:
      m?.imageMessage?.mimetype ??
      m?.audioMessage?.mimetype ??
      m?.documentMessage?.mimetype ??
      null,
  };
}

function mensagemFoiLida(msg: EvolutionMessage): boolean {
  return (msg.MessageUpdate ?? []).some((u) => {
    const s = (u?.status ?? "").toUpperCase();
    return s === "READ" || s === "PLAYED";
  });
}

// Throttle por integração — evita marretar a Evolution a cada polling de 2s.
const ultimaSyncPorIntegracao = new Map<string, number>();

export interface ResultadoSync {
  conversasProcessadas: number;
  mensagensNovas: number;
  lidasAtualizadas: number;
}

export async function sincronizarInstancia(params: {
  integracaoId: string;
  instanceName: string;
  /** JID sempre processado mesmo sem novidade aparente (conversa aberta na tela). */
  jidPrioritario?: string;
  /** Ignora o throttle (bootstrap/backfill manual). */
  forcar?: boolean;
  /** Intervalo mínimo entre syncs da mesma integração. */
  intervaloMs?: number;
}): Promise<ResultadoSync | null> {
  const { integracaoId, instanceName, jidPrioritario, forcar = false, intervaloMs = 4000 } = params;

  const agora = Date.now();
  if (!forcar && agora - (ultimaSyncPorIntegracao.get(integracaoId) ?? 0) < intervaloMs) {
    return null;
  }
  ultimaSyncPorIntegracao.set(integracaoId, agora);

  const [chats, mensagens] = await Promise.all([
    listarChats(instanceName, 200),
    listarTodasMensagens(instanceName, 300),
  ]);
  if (mensagens.length === 0 && chats.length === 0) {
    return { conversasProcessadas: 0, mensagensNovas: 0, lidasAtualizadas: 0 };
  }

  // Metadados (nome/foto) por JID canônico, vindos da lista de chats.
  const metaPorJid = new Map<string, { pushName?: string | null }>();
  for (const chat of chats) {
    const jid = jidCanonico(chat.remoteJid, chat.lastMessage?.key?.remoteJidAlt);
    if (!jidValidoParaInbox(jid)) continue;
    if (!metaPorJid.has(jid)) metaPorJid.set(jid, { pushName: chat.pushName });
  }

  // Agrupa mensagens por JID canônico e registra aliases @lid encontrados.
  const grupos = new Map<string, Map<string, EvolutionMessage>>();
  const aliasesPorJid = new Map<string, Set<string>>();
  for (const msg of mensagens) {
    const bruto = msg.key?.remoteJid;
    const messageId = msg.key?.id;
    if (!bruto || !messageId) continue;
    const jid = jidCanonico(bruto, msg.key?.remoteJidAlt);
    if (!jidValidoParaInbox(jid)) continue;

    if (bruto !== jid) {
      const set = aliasesPorJid.get(jid) ?? new Set<string>();
      set.add(bruto);
      aliasesPorJid.set(jid, set);
    }
    const grupo = grupos.get(jid) ?? new Map<string, EvolutionMessage>();
    if (!grupo.has(messageId)) grupo.set(messageId, msg);
    grupos.set(jid, grupo);
  }

  // Estado atual local para decidir o que precisa ser reprocessado.
  const conversasLocais = await prisma.conversaWpp.findMany({
    where: { integracaoId },
    select: { id: true, remoteJid: true, ultimaMensagem: true, nomeContato: true },
  });
  const conversaPorJid = new Map(conversasLocais.map((c) => [c.remoteJid, c]));

  const resultado: ResultadoSync = {
    conversasProcessadas: 0,
    mensagensNovas: 0,
    lidasAtualizadas: 0,
  };

  for (const [jid, grupo] of grupos) {
    const msgs = [...grupo.values()];
    const maxTsMs = Math.max(...msgs.map((m) => (m.messageTimestamp ?? 0) * 1000));
    const local = conversaPorJid.get(jid);
    const temAlias = (aliasesPorJid.get(jid)?.size ?? 0) > 0;

    // Pula conversas sem novidade — exceto a aberta na tela (status de leitura)
    // e as que precisam de merge de alias @lid.
    const prioritaria = jid === jidPrioritario;
    if (local && !prioritaria && !temAlias && local.ultimaMensagem && maxTsMs < local.ultimaMensagem.getTime()) {
      continue;
    }
    resultado.conversasProcessadas += 1;

    const nomeContato =
      msgs.find((m) => !m.key?.fromMe && m.pushName)?.pushName ??
      metaPorJid.get(jid)?.pushName ??
      null;

    // Evita upsert quando a conversa já existe e o nome não mudou.
    let conversa: { id: string };
    if (local && (!nomeContato || local.nomeContato === nomeContato)) {
      conversa = { id: local.id };
    } else {
      conversa = await prisma.conversaWpp.upsert({
        where: { integracaoId_remoteJid: { integracaoId, remoteJid: jid } },
        update: nomeContato ? { nomeContato } : {},
        create: {
          integracaoId,
          remoteJid: jid,
          nomeContato,
          totalNaoLidas: 0,
          ultimaMensagem: new Date(maxTsMs || Date.now()),
        },
        select: { id: true },
      });
    }
    let houveMerge = false;

    // Funde conversas antigas criadas com o alias @lid na canônica.
    for (const alias of aliasesPorJid.get(jid) ?? []) {
      const duplicada = conversaPorJid.get(alias);
      if (!duplicada || duplicada.id === conversa.id) continue;
      const msgsDuplicada = await prisma.mensagemWpp.findMany({
        where: { conversaId: duplicada.id },
        select: { id: true, messageId: true },
      });
      for (const md of msgsDuplicada) {
        const jaExiste = await prisma.mensagemWpp.findUnique({
          where: { conversaId_messageId: { conversaId: conversa.id, messageId: md.messageId } },
          select: { id: true },
        });
        if (jaExiste) {
          await prisma.mensagemWpp.delete({ where: { id: md.id } });
        } else {
          await prisma.mensagemWpp.update({ where: { id: md.id }, data: { conversaId: conversa.id } });
        }
      }
      await prisma.conversaWpp.delete({ where: { id: duplicada.id } });
      conversaPorJid.delete(alias);
      houveMerge = true;
    }

    const existentes = await prisma.mensagemWpp.findMany({
      where: { conversaId: conversa.id },
      select: { messageId: true, lida: true, fromMe: true },
    });
    const existentePorId = new Map(existentes.map((e) => [e.messageId, e]));

    // Insere mensagens que ainda não temos (em lote).
    const novas = msgs.filter((m) => !existentePorId.has(m.key!.id!));
    if (novas.length > 0) {
      await prisma.mensagemWpp.createMany({
        data: novas.map((m) => {
          const fromMe = !!m.key?.fromMe;
          const { mediaUrl, mimetype } = extrairMedia(m);
          return {
            conversaId: conversa.id,
            messageId: m.key!.id!,
            fromMe,
            tipo: normalizarTipo(m.messageType),
            corpo: extrairCorpo(m),
            mediaUrl,
            mimetype,
            timestamp: m.messageTimestamp ? new Date(m.messageTimestamp * 1000) : new Date(),
            lida: fromMe ? mensagemFoiLida(m) : false,
          };
        }),
        skipDuplicates: true,
      });
      resultado.mensagensNovas += novas.length;
    }

    // Reflete confirmação de leitura (check azul) nas mensagens já gravadas.
    const idsLidas = msgs
      .filter((m) => {
        const existente = existentePorId.get(m.key!.id!);
        return existente?.fromMe && !existente.lida && mensagemFoiLida(m);
      })
      .map((m) => m.key!.id!);
    if (idsLidas.length > 0) {
      const { count } = await prisma.mensagemWpp.updateMany({
        where: { conversaId: conversa.id, messageId: { in: idsLidas } },
        data: { lida: true },
      });
      resultado.lidasAtualizadas += count;
    }

    // Recalcula o resumo apenas se algo de fato mudou nesta conversa.
    if (novas.length > 0 || idsLidas.length > 0 || houveMerge) {
      const [naoLidas, ultima] = await Promise.all([
        prisma.mensagemWpp.count({ where: { conversaId: conversa.id, fromMe: false, lida: false } }),
        prisma.mensagemWpp.findFirst({
          where: { conversaId: conversa.id },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        }),
      ]);
      await prisma.conversaWpp.update({
        where: { id: conversa.id },
        data: { totalNaoLidas: naoLidas, ultimaMensagem: ultima?.timestamp ?? undefined },
      });
    }
  }

  return resultado;
}
