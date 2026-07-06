"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { requireTenantPorSlug } from "@/lib/tenant/resolver";
import {
  criarInstancia,
  configurarWebhookInstancia,
  obterQrCode,
  statusInstancia,
  desconectarInstancia,
  deletarInstancia,
  enviarTexto,
  marcarComoLido,
  wppInstanceName,
} from "./evolution";
import { sincronizarInstancia } from "./sync";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://volante7.com.br";
}

async function assertWppEnabled(tenantId: string) {
  const t = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappHabilitado: true },
  });
  if (!t?.whatsappHabilitado) throw new Error("Módulo WhatsApp não habilitado para esta loja.");
}

// ─── Conectar instância ──────────────────────────────────────────────────────

export async function conectarWhatsAppAction(
  slug: string,
): Promise<{ error?: string; qrCode?: string; status?: string; qrExpiresAt?: string }> {
  const session = await requireSession();
  const tenant  = await requireTenantPorSlug(slug);
  await assertWppEnabled(tenant.id);

  const instanceName  = wppInstanceName(tenant.id);
  const webhookSecret = randomBytes(32).toString("hex");
  const webhookUrl    = `${appUrl()}/api/webhooks/whatsapp/${instanceName}`;

  // Upsert integration record
  const integracao = await prisma.integracaoWhatsApp.upsert({
    where:  { tenantId: tenant.id },
    update: { status: "AGUARDANDO_QR" },
    create: {
      tenantId:     tenant.id,
      instanceName,
      status:       "AGUARDANDO_QR",
      webhookSecret,
    },
  });

  try {
    await criarInstancia(instanceName, webhookUrl, integracao.webhookSecret);
    // Mesmo que a instância já exista (criada em outro ambiente), força a
    // configuração do webhook atual para evitar ficar apontando para localhost.
    await configurarWebhookInstancia(instanceName, webhookUrl, integracao.webhookSecret);
    const qr = await obterQrCode(instanceName);
    const qrExpiresAt = new Date(Date.now() + 60_000); // QR válido por 60s

    await prisma.integracaoWhatsApp.update({
      where:  { tenantId: tenant.id },
      data: {
        qrCode: qr.qrcode,
        qrExpiresAt,
        status: "AGUARDANDO_QR",
      },
    });

    revalidatePath(`/t/${slug}/whatsapp/configurar`);
    return { qrCode: qr.qrcode, status: "AGUARDANDO_QR", qrExpiresAt: qrExpiresAt.toISOString() };
  } catch (err) {
    // Evita deixar o registro preso em "AGUARDANDO_QR" sem QR code — isso
    // travava a tela em "Gerando QR code..." para sempre a cada novo acesso,
    // já que o status é lido do banco a cada carregamento da página.
    await prisma.integracaoWhatsApp.update({
      where: { tenantId: tenant.id },
      data:  { status: "ERRO", qrCode: null, qrExpiresAt: null },
    }).catch(() => {});

    revalidatePath(`/t/${slug}/whatsapp/configurar`);
    return { error: String(err), status: "ERRO" };
  }
}

/** Polling: retorna estado atual da instância (status + QR se disponível). */
export async function statusWhatsAppAction(slug: string): Promise<{
  status: string;
  numero?: string | null;
  qrCode?: string | null;
  qrExpiresAt?: string | null;
}> {
  const tenant = await requireTenantPorSlug(slug);
  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where: { tenantId: tenant.id },
    select: { status: true, numeroConectado: true, qrCode: true, qrExpiresAt: true, instanceName: true },
  });
  if (!integracao) return { status: "DESCONECTADO" };

  // Check live status from Evolution API
  try {
    const live = await statusInstancia(integracao.instanceName);
    if (live?.status === "open" && integracao.status !== "CONECTADO") {
      await prisma.integracaoWhatsApp.update({
        where:  { tenantId: tenant.id },
        data: {
          status:         "CONECTADO",
          numeroConectado: live.number ?? null,
          qrCode:         null,
          qrExpiresAt:    null,
        },
      });
      revalidatePath(`/t/${slug}/whatsapp/configurar`);
      return { status: "CONECTADO", numero: live.number };
    }
  } catch {
    // Ignore — return cached state
  }

  return {
    status:      integracao.status,
    numero:      integracao.numeroConectado,
    qrCode:      integracao.qrCode,
    qrExpiresAt: integracao.qrExpiresAt?.toISOString() ?? null,
  };
}

export async function desconectarWhatsAppAction(
  slug: string,
): Promise<{ error?: string }> {
  await requireSession();
  const tenant = await requireTenantPorSlug(slug);
  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where: { tenantId: tenant.id },
    select: { instanceName: true },
  });
  if (!integracao) return {};

  try {
    await desconectarInstancia(integracao.instanceName);
  } catch { /* best-effort */ }

  await prisma.integracaoWhatsApp.update({
    where: { tenantId: tenant.id },
    data:  { status: "DESCONECTADO", numeroConectado: null, qrCode: null },
  });
  revalidatePath(`/t/${slug}/whatsapp`);
  revalidatePath(`/t/${slug}/whatsapp/configurar`);
  return {};
}

export async function removerInstanciaAction(
  slug: string,
): Promise<{ error?: string }> {
  await requireSession();
  const tenant = await requireTenantPorSlug(slug);
  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where: { tenantId: tenant.id },
    select: { instanceName: true },
  });
  if (!integracao) return {};

  try {
    await deletarInstancia(integracao.instanceName);
  } catch { /* best-effort */ }

  await prisma.integracaoWhatsApp.delete({ where: { tenantId: tenant.id } });
  revalidatePath(`/t/${slug}/whatsapp/configurar`);
  return {};
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

export async function enviarMensagemAction(
  slug: string,
  conversaId: string,
  texto: string,
): Promise<{ error?: string; messageId?: string }> {
  await requireSession();
  const tenant = await requireTenantPorSlug(slug);

  const [integracao, conversa] = await Promise.all([
    prisma.integracaoWhatsApp.findUnique({
      where:  { tenantId: tenant.id },
      select: { instanceName: true, status: true, id: true },
    }),
    prisma.conversaWpp.findUnique({
      where:  { id: conversaId },
      select: { remoteJid: true, integracaoId: true },
    }),
  ]);

  if (!integracao || integracao.status !== "CONECTADO")
    return { error: "WhatsApp não está conectado." };
  if (!conversa || conversa.integracaoId !== integracao.id)
    return { error: "Conversa não encontrada." };

  try {
    const sent = await enviarTexto(integracao.instanceName, conversa.remoteJid, texto.trim());
    const msg = await prisma.mensagemWpp.create({
      data: {
        conversaId,
        messageId: sent.key.id,
        fromMe:    true,
        tipo:      "text",
        corpo:     texto.trim(),
        timestamp: new Date(),
        lida:      false,
      },
    });
    await prisma.conversaWpp.update({
      where: { id: conversaId },
      data:  { ultimaMensagem: new Date() },
    });
    revalidatePath(`/t/${slug}/whatsapp/${conversaId}`);
    return { messageId: msg.id };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function atualizarConfigWppAction(
  slug: string,
  config: { criarLeadAuto: boolean },
): Promise<{ error?: string }> {
  await requireSession();
  const tenant = await requireTenantPorSlug(slug);
  await assertWppEnabled(tenant.id);

  const integracao = await prisma.integracaoWhatsApp.findUnique({
    where:  { tenantId: tenant.id },
    select: { id: true },
  });
  if (!integracao) return { error: "Integração não encontrada. Conecte o WhatsApp primeiro." };

  await prisma.integracaoWhatsApp.update({
    where: { id: integracao.id },
    data:  { criarLeadAuto: config.criarLeadAuto },
  });

  revalidatePath(`/t/${slug}/whatsapp/configurar`);
  return {};
}

export async function marcarLidasAction(
  slug: string,
  conversaId: string,
): Promise<void> {
  const tenant = await requireTenantPorSlug(slug);
  const conversa = await prisma.conversaWpp.findUnique({
    where:  { id: conversaId },
    select: { remoteJid: true, integracao: { select: { instanceName: true, tenantId: true } } },
  });
  if (!conversa || conversa.integracao.tenantId !== tenant.id) return;

  const msgs = await prisma.mensagemWpp.findMany({
    where:  { conversaId, fromMe: false, lida: false },
    select: { messageId: true },
  });
  if (msgs.length === 0) return;

  await Promise.all([
    prisma.mensagemWpp.updateMany({ where: { conversaId, lida: false }, data: { lida: true } }),
    prisma.conversaWpp.update({ where: { id: conversaId }, data: { totalNaoLidas: 0 } }),
    marcarComoLido(conversa.integracao.instanceName, conversa.remoteJid, msgs.map(m => m.messageId)),
  ]);
}

/** Retorna mensagens de uma conversa (chamado pelo polling do chat). */
export async function getMensagensAction(
  slug: string,
  conversaId: string,
  depoisDe?: Date,
): Promise<{ id: string; fromMe: boolean; corpo: string | null; tipo: string; timestamp: Date; lida: boolean }[]> {
  const tenant = await requireTenantPorSlug(slug);
  const conversa = await prisma.conversaWpp.findUnique({
    where:  { id: conversaId },
    select: {
      remoteJid: true,
      integracao: { select: { id: true, tenantId: true, instanceName: true, status: true } },
    },
  });
  if (!conversa || conversa.integracao.tenantId !== tenant.id) return [];

  if (conversa.integracao.status === "CONECTADO") {
    // Sync com a Evolution roda DEPOIS da resposta (after) para não segurar o
    // polling: este request devolve o estado atual do banco na hora e o
    // próximo poll (2s) já enxerga o que o sync trouxe.
    after(() =>
      sincronizarInstancia({
        integracaoId: conversa.integracao.id,
        instanceName: conversa.integracao.instanceName,
        jidPrioritario: conversa.remoteJid,
        intervaloMs: 3500,
      }).catch(() => {}),
    );
  }

  const mensagens = await prisma.mensagemWpp.findMany({
    where:   { conversaId, ...(depoisDe ? { timestamp: { gt: depoisDe } } : {}) },
    orderBy: { timestamp: "desc" },
    take:    250,
    select:  { id: true, fromMe: true, corpo: true, tipo: true, timestamp: true, lida: true },
  });
  return mensagens.reverse();
}
