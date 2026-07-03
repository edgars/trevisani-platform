import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/client";
import {
  otpLoginEmail,
  passwordResetLinkEmail,
  passwordResetOtpEmail,
} from "@/lib/integrations/email/templates/auth";
import { sendPlatformEmail } from "@/lib/integrations/email/send-platform";

import { findUsuarioByEmail } from "./load-usuario";
import { createAndSendOtp, generateResetToken, hashResetToken } from "./otp";

const RESET_TTL_HOURS = 1;

const GENERIC_SUCCESS =
  "Se existir uma conta com este e-mail, enviaremos as instruções em instantes.";

export async function requestPasswordResetLink(
  email: string,
): Promise<{ ok: true; message: string }> {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario?.senhaHash) {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${usuario.id}` },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${usuario.id}`,
      token: tokenHash,
      expires: new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/redefinir-senha?token=${token}&email=${encodeURIComponent(email)}`;
  const emailContent = passwordResetLinkEmail(usuario.nome, link);

  await sendPlatformEmail({
    para: email,
    assunto: emailContent.assunto,
    html: emailContent.html,
    texto: emailContent.texto,
  });

  return { ok: true, message: GENERIC_SUCCESS };
}

export async function requestPasswordResetOtp(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario?.senhaHash) {
    return { ok: true, message: GENERIC_SUCCESS };
  }

  const result = await createAndSendOtp({
    usuarioId: usuario.id,
    proposito: "RESET_SENHA",
    send: async (codigo) => {
      const emailContent = passwordResetOtpEmail(usuario.nome, codigo);
      await sendPlatformEmail({
        para: email,
        assunto: emailContent.assunto,
        html: emailContent.html,
        texto: emailContent.texto,
      });
    },
  });

  if (!result.ok) {
    return result;
  }

  return { ok: true, message: GENERIC_SUCCESS };
}

export async function resetPasswordWithToken(params: {
  email: string;
  token: string;
  novaSenha: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const usuario = await findUsuarioByEmail(params.email);
  if (!usuario) {
    return { ok: false, error: "Link inválido ou expirado." };
  }

  const tokenHash = hashResetToken(params.token);
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: `reset:${usuario.id}`,
      token: tokenHash,
      expires: { gt: new Date() },
    },
  });

  if (!record) {
    return { ok: false, error: "Link inválido ou expirado." };
  }

  const senhaHash = await bcrypt.hash(params.novaSenha, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${usuario.id}` },
    }),
  ]);

  return { ok: true };
}

export async function resetPasswordWithOtp(params: {
  email: string;
  codigo: string;
  novaSenha: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const usuario = await findUsuarioByEmail(params.email);
  if (!usuario) {
    return { ok: false, error: "Código inválido ou expirado." };
  }

  const { verifyOtp } = await import("./otp");
  const valido = await verifyOtp({
    usuarioId: usuario.id,
    proposito: "RESET_SENHA",
    codigo: params.codigo,
  });

  if (!valido) {
    return { ok: false, error: "Código inválido ou expirado." };
  }

  const senhaHash = await bcrypt.hash(params.novaSenha, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash },
  });

  return { ok: true };
}

export async function requestLoginOtp(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario) {
    return {
      ok: true,
      message: "Se existir uma conta com este e-mail, enviaremos um código em instantes.",
    };
  }

  const result = await createAndSendOtp({
    usuarioId: usuario.id,
    proposito: "LOGIN",
    send: async (codigo) => {
      const emailContent = otpLoginEmail(usuario.nome, codigo);
      await sendPlatformEmail({
        para: email,
        assunto: emailContent.assunto,
        html: emailContent.html,
        texto: emailContent.texto,
      });
    },
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    message: "Se existir uma conta com este e-mail, enviaremos um código em instantes.",
  };
}

export async function verifyLoginOtp(email: string, codigo: string): Promise<boolean> {
  const usuario = await findUsuarioByEmail(email);
  if (!usuario) return false;

  const { verifyOtp } = await import("./otp");
  return verifyOtp({
    usuarioId: usuario.id,
    proposito: "LOGIN",
    codigo,
  });
}
