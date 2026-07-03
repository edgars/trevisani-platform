import { Resend } from "resend";

import type { EmailInput, EmailProvider, EmailResult } from "./provider";

export class ResendEmailProvider implements EmailProvider {
  readonly nome = "RESEND";
  private client: Resend;

  constructor(apiKey = process.env.RESEND_API_KEY) {
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada.");
    }
    this.client = new Resend(apiKey);
  }

  async enviar(input: EmailInput): Promise<EmailResult> {
    const from = input.from ?? process.env.RESEND_FROM_EMAIL;
    if (!from) {
      throw new Error("RESEND_FROM_EMAIL não configurado.");
    }

    const para = Array.isArray(input.para) ? input.para : [input.para];

    const { data, error } = await this.client.emails.send({
      from,
      to: para,
      subject: input.assunto,
      html: input.html ?? input.texto ?? "",
      ...(input.texto ? { text: input.texto } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data?.id ?? "unknown",
      provedor: this.nome,
      status: "ENVIADO",
    };
  }
}

let provider: ResendEmailProvider | null = null;

export function getResendProvider(): ResendEmailProvider {
  if (!provider) {
    provider = new ResendEmailProvider();
  }
  return provider;
}
