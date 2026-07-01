/**
 * Interface `EmailProvider` (PRD 6.9). Implementações: Resend, SMTP.
 */

export interface EmailAttachment {
  filename: string;
  content: Uint8Array | string;
  contentType?: string;
}

export interface EmailInput {
  tenantId: string;
  para: string | string[];
  assunto: string;
  html?: string;
  texto?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  idempotencia?: string; // chave para deduplicação
}

export interface EmailResult {
  id: string;
  provedor: string;
  status: "ENVIADO" | "AGENDADO" | "FALHOU";
}

export interface EmailProvider {
  readonly nome: string;
  enviar(input: EmailInput): Promise<EmailResult>;
}
