const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Volante7";

function layout(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
          <tr><td>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#e11d48;">${APP_NAME}</p>
            ${conteudo}
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#71717a;">Se você não solicitou este e-mail, ignore-o com segurança.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpLoginEmail(nome: string, codigo: string): { assunto: string; html: string; texto: string } {
  const assunto = `Seu código de acesso — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 20px;color:#52525b;line-height:1.5;">Use o código abaixo para entrar na sua conta. Ele expira em <strong>10 minutos</strong>.</p>
    <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#18181b;text-align:center;">${codigo}</p>
    <p style="margin:0;color:#71717a;font-size:14px;line-height:1.5;">Não compartilhe este código com ninguém.</p>
  `);
  const texto = `Olá, ${nome}\n\nSeu código de acesso: ${codigo}\n\nExpira em 10 minutos.`;
  return { assunto, html, texto };
}

export function passwordResetLinkEmail(
  nome: string,
  link: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Redefinir sua senha — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 20px;color:#52525b;line-height:1.5;">Recebemos um pedido para redefinir sua senha. Clique no botão abaixo — o link expira em <strong>1 hora</strong>.</p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${link}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Redefinir senha</a>
    </p>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;word-break:break-all;">Ou copie este link: ${link}</p>
  `);
  const texto = `Olá, ${nome}\n\nRedefina sua senha em: ${link}\n\nO link expira em 1 hora.`;
  return { assunto, html, texto };
}

export function passwordResetOtpEmail(
  nome: string,
  codigo: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Código para redefinir senha — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 20px;color:#52525b;line-height:1.5;">Use o código abaixo para redefinir sua senha. Ele expira em <strong>10 minutos</strong>.</p>
    <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#18181b;text-align:center;">${codigo}</p>
  `);
  const texto = `Olá, ${nome}\n\nCódigo para redefinir senha: ${codigo}\n\nExpira em 10 minutos.`;
  return { assunto, html, texto };
}
