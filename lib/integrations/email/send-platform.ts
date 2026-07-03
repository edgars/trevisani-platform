import { getResendProvider } from "./resend";

interface PlatformEmailInput {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
}

export async function sendPlatformEmail(input: PlatformEmailInput): Promise<void> {
  const provider = getResendProvider();
  await provider.enviar({
    para: input.para,
    assunto: input.assunto,
    html: input.html,
    texto: input.texto,
  });
}
