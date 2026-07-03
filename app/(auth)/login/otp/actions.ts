"use server";

import { z } from "zod";

import { requestLoginOtp } from "@/lib/auth/password-reset";

const emailSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export type OtpLoginState =
  | { status: "idle" }
  | { status: "success"; message: string; email: string }
  | { status: "error"; message: string };

export async function solicitarLoginOtp(
  _prev: OtpLoginState,
  formData: FormData,
): Promise<OtpLoginState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  try {
    const result = await requestLoginOtp(parsed.data.email);
    if (!result.ok) {
      return { status: "error", message: result.error };
    }
    return {
      status: "success",
      message: result.message,
      email: parsed.data.email,
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível enviar o código. Tente novamente em instantes.",
    };
  }
}
