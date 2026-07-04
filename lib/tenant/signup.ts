import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/client";
import { sendPlatformEmail } from "@/lib/integrations/email/send-platform";
import { confirmacaoContaEmail } from "@/lib/integrations/email/templates/onboarding";
import { generateResetToken, hashResetToken } from "@/lib/auth/otp";
import { findUsuarioByEmail } from "@/lib/auth/load-usuario";
import { gerarSlugUnico } from "@/lib/tenant/slugs";
import { provisionarPapeisPadraoTenant } from "@/lib/tenant/papeis-padrao";

const CONFIRMACAO_TTL_HORAS = 48;

export interface CriarContaInput {
  nomeLoja: string;
  nomeResponsavel: string;
  email: string;
  senha: string;
  planoId?: string | null;
}

export type CriarContaResult =
  | { ok: true; tenantId: string; slug: string; email: string }
  | { ok: false; error: string };

/**
 * Provisiona a conta completa de um novo tenant self-service:
 * Tenant + Usuario (STAFF/admin) + papéis padrão, e dispara o e-mail de
 * confirmação. A conta só pode ser usada para login após a confirmação.
 */
export async function criarContaTenant(input: CriarContaInput): Promise<CriarContaResult> {
  const email = input.email.trim().toLowerCase();

  const existente = await findUsuarioByEmail(email);
  if (existente) {
    return { ok: false, error: "Já existe uma conta com este e-mail." };
  }

  const planoGratis = await prisma.plano.findFirst({
    where: { slug: "gratis", ativo: true },
    select: { id: true },
  });

  const planoId = input.planoId ?? planoGratis?.id ?? null;
  const slug = await gerarSlugUnico(input.nomeLoja);
  const senhaHash = await bcrypt.hash(input.senha, 10);

  const { tenantId, usuarioId } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        nome: input.nomeLoja.trim(),
        slug,
        status: "ATIVO",
        planoId,
        configJson: { slugInicial: slug },
      },
    });

    const usuario = await tx.usuario.create({
      data: {
        tenantId: tenant.id,
        escopo: "STAFF",
        nome: input.nomeResponsavel.trim(),
        email,
        senhaHash,
      },
    });

    return { tenantId: tenant.id, usuarioId: usuario.id };
  });

  const { papelAdmin } = await provisionarPapeisPadraoTenant(prisma, tenantId);
  if (papelAdmin) {
    await prisma.usuarioPapel.create({
      data: { usuarioId, papelId: papelAdmin.id },
    });
  }

  await enviarEmailConfirmacao({ usuarioId, nome: input.nomeResponsavel, nomeLoja: input.nomeLoja, email });

  return { ok: true, tenantId, slug, email };
}

async function enviarEmailConfirmacao(params: {
  usuarioId: string;
  nome: string;
  nomeLoja: string;
  email: string;
}): Promise<void> {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `signup:${params.usuarioId}` },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: `signup:${params.usuarioId}`,
      token: tokenHash,
      expires: new Date(Date.now() + CONFIRMACAO_TTL_HORAS * 60 * 60 * 1000),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/confirmar-conta?token=${token}&email=${encodeURIComponent(params.email)}`;
  const conteudo = confirmacaoContaEmail(params.nome, params.nomeLoja, link);

  await sendPlatformEmail({
    para: params.email,
    assunto: conteudo.assunto,
    html: conteudo.html,
    texto: conteudo.texto,
  });
}

/** Reenvia o e-mail de confirmação (usado quando o login falha por conta não confirmada). */
export async function reenviarEmailConfirmacao(email: string): Promise<{ ok: true }> {
  const usuario = await findUsuarioByEmail(email.trim().toLowerCase());
  if (!usuario || usuario.escopo !== "STAFF") return { ok: true }; // resposta genérica

  const tenant = usuario.tenantSlug
    ? await prisma.tenant.findUnique({ where: { slug: usuario.tenantSlug }, select: { nome: true } })
    : null;

  await enviarEmailConfirmacao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    nomeLoja: tenant?.nome ?? "sua loja",
    email: usuario.email,
  });

  return { ok: true };
}

export type ConfirmarContaResult = { ok: true } | { ok: false; error: string };

/** Valida o token do link de confirmação e marca o e-mail como verificado. */
export async function confirmarContaComToken(email: string, token: string): Promise<ConfirmarContaResult> {
  const usuario = await findUsuarioByEmail(email.trim().toLowerCase());
  if (!usuario) return { ok: false, error: "Link inválido ou expirado." };

  const tokenHash = hashResetToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `signup:${usuario.id}`,
      token: tokenHash,
      expires: { gt: new Date() },
    },
  });

  if (!record) return { ok: false, error: "Link inválido ou expirado. Solicite um novo e-mail de confirmação." };

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: usuario.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: `signup:${usuario.id}` },
    }),
  ]);

  return { ok: true };
}
