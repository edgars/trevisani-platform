"use server";

import { z } from "zod";

import {
  resetPasswordWithOtp,
  resetPasswordWithToken,
} from "@/lib/auth/password-reset";

const tokenSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  novaSenha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmarSenha: z.string(),
}).refine((d) => d.novaSenha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

const otpSchema = z.object({
  email: z.string().email(),
  codigo: z.string().length(6, "Código deve ter 6 dígitos."),
  novaSenha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmarSenha: z.string(),
}).refine((d) => d.novaSenha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

export type RedefinirSenhaState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function redefinirComToken(
  _prev: RedefinirSenhaState,
  formData: FormData,
): Promise<RedefinirSenhaState> {
  const parsed = tokenSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Dados inválidos.";
    return { status: "error", message: msg };
  }

  try {
    const result = await resetPasswordWithToken({
      email: parsed.data.email,
      token: parsed.data.token,
      novaSenha: parsed.data.novaSenha,
    });
    if (!result.ok) {
      return { status: "error", message: result.error };
    }
    return { status: "success" };
  } catch {
    return { status: "error", message: "Não foi possível redefinir a senha." };
  }
}

export async function redefinirComOtp(
  _prev: RedefinirSenhaState,
  formData: FormData,
): Promise<RedefinirSenhaState> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    codigo: formData.get("codigo"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Dados inválidos.";
    return { status: "error", message: msg };
  }

  try {
    const result = await resetPasswordWithOtp({
      email: parsed.data.email,
      codigo: parsed.data.codigo,
      novaSenha: parsed.data.novaSenha,
    });
    if (!result.ok) {
      return { status: "error", message: result.error };
    }
    return { status: "success" };
  } catch {
    return { status: "error", message: "Não foi possível redefinir a senha." };
  }
}
