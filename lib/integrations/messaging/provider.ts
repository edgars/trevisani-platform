/**
 * Interface `MessagingProvider` (PRD 6.9). Implementações: Evolution API,
 * WhatsApp Cloud API.
 */

export interface WhatsappInput {
  tenantId: string;
  para: string; // E.164 (ex.: 5511999998888)
  mensagem: string;
  midias?: Array<{
    tipo: "IMAGEM" | "PDF" | "AUDIO";
    url: string;
    caption?: string;
  }>;
  idempotencia?: string;
}

export interface WhatsappResult {
  id: string;
  provedor: string;
  status: "ENVIADO" | "AGENDADO" | "FALHOU";
}

export interface MessagingProvider {
  readonly nome: string;
  enviar(input: WhatsappInput): Promise<WhatsappResult>;
}
