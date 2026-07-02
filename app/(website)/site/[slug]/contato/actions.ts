"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";

const leadSchema = z.object({
  tenantId: z.string().min(1),
  nome: z.string().min(2, "Informe seu nome.").max(120),
  telefone: z.string().min(8, "Telefone inválido.").max(20),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  mensagem: z.string().min(5, "Escreva uma mensagem.").max(1000),
  veiculoId: z.string().optional().or(z.literal("")),
});

export type LeadFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; errors: Record<string, string[]> };

export async function enviarLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const raw = {
    tenantId: formData.get("tenantId") as string,
    nome: formData.get("nome") as string,
    telefone: formData.get("telefone") as string,
    email: (formData.get("email") as string) ?? "",
    mensagem: formData.get("mensagem") as string,
    veiculoId: (formData.get("veiculoId") as string) ?? "",
  };

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { tenantId, nome, telefone, email, mensagem, veiculoId } = parsed.data;

  let titulo = `Novo lead: ${nome}`;
  let corpo = `Telefone: ${telefone}\n`;
  if (email) corpo += `E-mail: ${email}\n`;
  corpo += `\nMensagem:\n${mensagem}`;

  if (veiculoId) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: veiculoId, tenantId },
      select: { marca: true, modelo: true, anoModelo: true },
    });
    if (veiculo) {
      titulo = `Lead: ${nome} → ${veiculo.marca} ${veiculo.modelo} ${veiculo.anoModelo}`;
      corpo = `Veículo: ${veiculo.marca} ${veiculo.modelo} ${veiculo.anoModelo}\n` + corpo;
    }
  }

  await prisma.notificacao.create({
    data: {
      tenantId,
      titulo,
      corpo,
      meta: { fonte: "vitrine", nome, telefone, email, veiculoId: veiculoId || null },
    },
  });

  return {
    status: "success",
    message: "Mensagem enviada! Entraremos em contato em breve.",
  };
}
