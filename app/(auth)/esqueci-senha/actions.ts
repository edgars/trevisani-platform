"use server";

import { z } from "zod";

import {
  requestPasswordResetLink,
  requestPasswordResetOtp,
} from "@/lib/auth/password-reset";

const emailSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export type EsqueciSenhaState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function solicitarResetLink(
  _prev: EsqueciSenhaState,
  formData: FormData,
): Promise<EsqueciSenhaState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  try {
    const result = await requestPasswordResetLink(parsed.data.email);
    return { status: "success", message: result.message };
  } catch {
    return {
      status: "error",
      message: "Não foi possível enviar o e-mail. Tente novamente em instantes.",
    };
  }
}

export async function solicitarResetOtp(
  _prev: EsqueciSenhaState,
  formData: FormData,
): Promise<EsqueciSenhaState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  try {
    const result = await requestPasswordResetOtp(parsed.data.email);
    if (!result.ok) {
      return { status: "error", message: result.error };
    }
    return { status: "success", message: result.message };
  } catch {
    return {
      status: "error",
      message: "Não foi possível enviar o código. Tente novamente em instantes.",
    };
  }
}
