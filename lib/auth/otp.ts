import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";

import type { OtpProposito } from "@prisma/client";

import { prisma } from "@/lib/db/client";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function createAndSendOtp(params: {
  usuarioId: string;
  proposito: OtpProposito;
  send: (codigo: string) => Promise<void>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const recent = await prisma.otpCode.findFirst({
    where: {
      usuarioId: params.usuarioId,
      proposito: params.proposito,
      usadoEm: null,
      createdAt: { gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    return {
      ok: false,
      error: `Aguarde ${OTP_RESEND_COOLDOWN_SECONDS} segundos antes de solicitar um novo código.`,
    };
  }

  await prisma.otpCode.updateMany({
    where: {
      usuarioId: params.usuarioId,
      proposito: params.proposito,
      usadoEm: null,
    },
    data: { usadoEm: new Date() },
  });

  const codigo = generateOtpCode();
  const codigoHash = await bcrypt.hash(codigo, 10);

  await prisma.otpCode.create({
    data: {
      usuarioId: params.usuarioId,
      codigoHash,
      proposito: params.proposito,
      expires: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await params.send(codigo);

  return { ok: true };
}

export async function verifyOtp(params: {
  usuarioId: string;
  proposito: OtpProposito;
  codigo: string;
}): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      usuarioId: params.usuarioId,
      proposito: params.proposito,
      usadoEm: null,
      expires: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  if (otp.tentativas >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usadoEm: new Date() },
    });
    return false;
  }

  const valido = await bcrypt.compare(params.codigo, otp.codigoHash);

  if (!valido) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { tentativas: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usadoEm: new Date() },
  });

  return true;
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${randomInt(1_000_000, 9_999_999)}`)
    .digest("hex");
}
