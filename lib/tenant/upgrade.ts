// Regras de limite de plano (nº de veículos) e notificação de upgrade.
// Pagamento ainda é manual: quando o limite é atingido, avisamos o lojista
// e a equipe interna por e-mail; a ativação do novo plano é feita pelo
// Super Admin em /admin/tenants.

import { prisma } from "@/lib/db/client";
import { sendPlatformEmail } from "@/lib/integrations/email/send-platform";
import {
  limiteVeiculosAtingidoEmail,
  notificacaoInternaUpgradeEmail,
  upgradeSolicitadoConfirmacaoEmail,
} from "@/lib/integrations/email/templates/onboarding";

const NOTIFICACAO_COOLDOWN_MS = 24 * 60 * 60 * 1000; // evita reenviar a cada tentativa

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function alertEmail(): string {
  return process.env.PLATFORM_ALERT_EMAIL ?? "edgar+volante7@skalena.com";
}

export interface LimiteVeiculosInfo {
  atingido: boolean;
  total: number;
  limite: number; // -1 = ilimitado
  planoNome: string;
}

/** Verifica se o tenant pode cadastrar mais um veículo dado o limite do plano. */
export async function verificarLimiteVeiculos(tenantId: string): Promise<LimiteVeiculosInfo> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plano: { select: { nome: true, limiteVeiculos: true } } },
  });

  const limite = tenant?.plano?.limiteVeiculos ?? 1;
  const planoNome = tenant?.plano?.nome ?? "sem plano";

  if (limite === -1) {
    return { atingido: false, total: 0, limite, planoNome };
  }

  const total = await prisma.veiculo.count({ where: { tenantId } });
  return { atingido: total >= limite, total, limite, planoNome };
}

/**
 * Dispara (no máx. 1x por 24h) o e-mail para o lojista + alerta interno da
 * equipe quando o limite de veículos do plano é atingido.
 */
export async function notificarLimiteVeiculosAtingido(params: {
  tenantId: string;
  tenantSlug: string;
  tenantNome: string;
  planoNome: string;
  limite: number;
  totalVeiculos: number;
}): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: { upgradeSolicitadoEm: true },
  });

  const jaNotificadoRecentemente =
    !!tenant?.upgradeSolicitadoEm &&
    Date.now() - tenant.upgradeSolicitadoEm.getTime() < NOTIFICACAO_COOLDOWN_MS;

  if (jaNotificadoRecentemente) return;

  const responsavel = await prisma.usuario.findFirst({
    where: { tenantId: params.tenantId, escopo: "STAFF", ativo: true },
    orderBy: { createdAt: "asc" },
    select: { nome: true, email: true },
  });
  if (!responsavel) return;

  await prisma.tenant.update({
    where: { id: params.tenantId },
    data: { upgradeSolicitadoEm: new Date() },
  });

  const linkPlanos = `${baseUrl()}/t/${params.tenantSlug}/configuracoes/plano`;

  const emailLojista = limiteVeiculosAtingidoEmail(
    responsavel.nome,
    params.tenantNome,
    params.limite,
    params.planoNome,
    linkPlanos,
  );

  const emailInterno = notificacaoInternaUpgradeEmail({
    nomeLoja: params.tenantNome,
    slug: params.tenantSlug,
    responsavelNome: responsavel.nome,
    responsavelEmail: responsavel.email,
    planoAtual: params.planoNome,
    totalVeiculos: params.totalVeiculos,
    linkAdmin: `${baseUrl()}/admin/tenants/${params.tenantId}`,
  });

  await Promise.allSettled([
    sendPlatformEmail({ para: responsavel.email, assunto: emailLojista.assunto, html: emailLojista.html, texto: emailLojista.texto }),
    sendPlatformEmail({ para: alertEmail(), assunto: emailInterno.assunto, html: emailInterno.html, texto: emailInterno.texto }),
  ]);
}

/** Disparado quando o próprio lojista clica em "Solicitar upgrade" na tela de plano. */
export async function solicitarUpgradeManual(tenantId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { nome: true, slug: true, plano: { select: { nome: true } } },
  });
  if (!tenant) return { ok: false, error: "Loja não encontrada." };

  const responsavel = await prisma.usuario.findFirst({
    where: { tenantId, escopo: "STAFF", ativo: true },
    orderBy: { createdAt: "asc" },
    select: { nome: true, email: true },
  });
  if (!responsavel) return { ok: false, error: "Nenhum responsável encontrado para esta loja." };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { upgradeSolicitadoEm: new Date() },
  });

  const total = await prisma.veiculo.count({ where: { tenantId } });

  const emailLojista = upgradeSolicitadoConfirmacaoEmail(responsavel.nome, tenant.nome);
  const emailInterno = notificacaoInternaUpgradeEmail({
    nomeLoja: tenant.nome,
    slug: tenant.slug,
    responsavelNome: responsavel.nome,
    responsavelEmail: responsavel.email,
    planoAtual: tenant.plano?.nome ?? "sem plano",
    totalVeiculos: total,
    linkAdmin: `${baseUrl()}/admin/tenants/${tenantId}`,
  });

  await Promise.allSettled([
    sendPlatformEmail({ para: responsavel.email, assunto: emailLojista.assunto, html: emailLojista.html, texto: emailLojista.texto }),
    sendPlatformEmail({ para: alertEmail(), assunto: emailInterno.assunto, html: emailInterno.html, texto: emailInterno.texto }),
  ]);

  return { ok: true };
}
