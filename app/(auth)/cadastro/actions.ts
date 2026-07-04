"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { criarContaTenant, reenviarEmailConfirmacao } from "@/lib/tenant/signup";

const cadastroSchema = z
  .object({
    nomeLoja: z.string().trim().min(2, "Informe o nome da sua loja."),
    nomeResponsavel: z.string().trim().min(2, "Informe seu nome."),
    email: z.string().trim().email("Informe um e-mail válido."),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    confirmarSenha: z.string(),
    planoSlug: z.string().optional(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type CadastroState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; email: string };

const initialState: CadastroState = { status: "idle" };
export { initialState as cadastroInitialState };

export async function criarContaAction(
  _prev: CadastroState,
  formData: FormData,
): Promise<CadastroState> {
  const parsed = cadastroSchema.safeParse({
    nomeLoja: formData.get("nomeLoja"),
    nomeResponsavel: formData.get("nomeResponsavel"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
    planoSlug: formData.get("planoSlug") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const { nomeLoja, nomeResponsavel, email, senha, planoSlug } = parsed.data;

  let planoId: string | null = null;
  if (planoSlug) {
    const plano = await prisma.plano.findFirst({
      where: { slug: planoSlug, ativo: true },
      select: { id: true },
    });
    planoId = plano?.id ?? null;
  }

  try {
    const result = await criarContaTenant({
      nomeLoja,
      nomeResponsavel,
      email,
      senha,
      planoId,
    });

    if (!result.ok) {
      return { status: "error", message: result.error };
    }

    return { status: "success", email: result.email };
  } catch {
    return { status: "error", message: "Não foi possível criar sua conta. Tente novamente em instantes." };
  }
}

export async function reenviarConfirmacaoAction(email: string): Promise<{ ok: true }> {
  return reenviarEmailConfirmacao(email);
}
