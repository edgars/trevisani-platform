/**
 * Interface `SignatureProvider` (padrão adapter, PRD seção 6.8).
 *
 * Provedor primário: DocuSign. Alternativas: ZapSign, Clicksign, D4Sign.
 * A implementação concreta é resolvida via IntegracaoConfig por tenant.
 */

export interface AssinaturaSignatarioInput {
  nome: string;
  email: string;
  cpf?: string;
  papel?: string;
  ordem?: number;
}

export interface AssinaturaEnvelopeInput {
  tenantId: string;
  nomeDocumento: string;
  documentoBytes: Uint8Array;
  signatarios: AssinaturaSignatarioInput[];
  mensagemInicial?: string;
  metadados?: Record<string, string | number | boolean>;
}

export interface AssinaturaEnvelopeResult {
  envelopeExterno: string;
  status: "ENVIADO" | "RASCUNHO" | "CANCELADO";
  urlAcompanhamento?: string;
}

export interface AssinaturaWebhookPayload {
  envelopeExterno: string;
  status:
    | "ENVIADO"
    | "PARCIALMENTE_ASSINADO"
    | "CONCLUIDO"
    | "CANCELADO"
    | "EXPIRADO";
  assinaturas: Array<{
    email: string;
    assinadoEm?: Date;
  }>;
  raw: unknown;
}

export interface SignatureProvider {
  readonly nome: string;

  enviarEnvelope(
    input: AssinaturaEnvelopeInput,
  ): Promise<AssinaturaEnvelopeResult>;

  cancelarEnvelope(envelopeExterno: string): Promise<void>;

  parseWebhook(request: Request): Promise<AssinaturaWebhookPayload>;
}

export class SignatureProviderNotConfiguredError extends Error {
  constructor(tenantId: string) {
    super(
      `Nenhum provedor de assinatura configurado para o tenant ${tenantId}.`,
    );
    this.name = "SignatureProviderNotConfiguredError";
  }
}
