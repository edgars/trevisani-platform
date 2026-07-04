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

export function confirmacaoContaEmail(
  nome: string,
  nomeLoja: string,
  link: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Confirme seu e-mail para ativar a ${nomeLoja} — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 20px;color:#52525b;line-height:1.5;">
      Falta só um passo para ativar a conta da <strong>${nomeLoja}</strong> no ${APP_NAME}.
      Confirme seu e-mail para começar a cadastrar seus veículos e publicar o site da sua loja.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${link}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Confirmar e-mail</a>
    </p>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;word-break:break-all;">Ou copie este link: ${link}</p>
  `);
  const texto = `Olá, ${nome}\n\nConfirme seu e-mail para ativar a conta da ${nomeLoja}: ${link}`;
  return { assunto, html, texto };
}

export function limiteVeiculosAtingidoEmail(
  nome: string,
  nomeLoja: string,
  limite: number,
  nomePlanoAtual: string,
  link: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Você atingiu o limite de veículos do plano ${nomePlanoAtual} — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 20px;color:#52525b;line-height:1.5;">
      A <strong>${nomeLoja}</strong> atingiu o limite de <strong>${limite} veículos</strong> do plano
      <strong>${nomePlanoAtual}</strong>. Para continuar cadastrando veículos, escolha um plano com
      mais capacidade — nossa equipe entrará em contato para concluir a ativação.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${link}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver planos e continuar</a>
    </p>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;word-break:break-all;">Ou copie este link: ${link}</p>
  `);
  const texto = `Olá, ${nome}\n\nA ${nomeLoja} atingiu o limite de ${limite} veículos do plano ${nomePlanoAtual}.\nVeja planos e continue em: ${link}`;
  return { assunto, html, texto };
}

export function notificacaoInternaUpgradeEmail(params: {
  nomeLoja: string;
  slug: string;
  responsavelNome: string;
  responsavelEmail: string;
  planoAtual: string;
  totalVeiculos: number;
  linkAdmin: string;
}): { assunto: string; html: string; texto: string } {
  const { nomeLoja, slug, responsavelNome, responsavelEmail, planoAtual, totalVeiculos, linkAdmin } = params;
  const assunto = `[Upgrade] ${nomeLoja} atingiu o limite do plano ${planoAtual}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">Lead pronto para conversão</h1>
    <p style="margin:0 0 16px;color:#52525b;line-height:1.5;">
      A loja <strong>${nomeLoja}</strong> (<code>${slug}</code>) atingiu o limite de veículos do
      plano <strong>${planoAtual}</strong> (${totalVeiculos} veículos cadastrados) e precisa migrar
      para um plano pago. O pagamento ainda é manual — entre em contato e ative o plano no painel.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:13px;">
      <tr><td style="padding:4px 0;color:#71717a;">Responsável</td><td style="padding:4px 0;text-align:right;">${responsavelNome}</td></tr>
      <tr><td style="padding:4px 0;color:#71717a;">E-mail</td><td style="padding:4px 0;text-align:right;">${responsavelEmail}</td></tr>
      <tr><td style="padding:4px 0;color:#71717a;">Plano atual</td><td style="padding:4px 0;text-align:right;">${planoAtual}</td></tr>
    </table>
    <p style="margin:0;text-align:center;">
      <a href="${linkAdmin}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;">Abrir no painel admin</a>
    </p>
  `);
  const texto = `${nomeLoja} (${slug}) atingiu o limite do plano ${planoAtual}.\nResponsável: ${responsavelNome} <${responsavelEmail}>\nPainel: ${linkAdmin}`;
  return { assunto, html, texto };
}

export function alerteLimitePlanoEmail(
  nome: string,
  nomeLoja: string,
  alertas: { recurso: string; pct: number; usado: number | string; limite: number | string }[],
  linkPlano: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Atenção: limite do plano próximo — ${nomeLoja}`;
  const itens = alertas.map(a =>
    `<li style="margin:4px 0;color:#52525b;">${a.recurso}: <strong>${a.pct}%</strong> utilizado (${a.usado} / ${a.limite})</li>`
  ).join("");
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 12px;color:#52525b;line-height:1.5;">
      A loja <strong>${nomeLoja}</strong> está próxima do limite em alguns recursos do plano atual:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;">${itens}</ul>
    <p style="margin:0 0 16px;color:#52525b;line-height:1.5;">
      Para evitar bloqueios, considere fazer upgrade do seu plano.
    </p>
    <a href="${linkPlano}" style="display:inline-block;padding:10px 20px;background:#18181b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">
      Ver meu plano
    </a>
  `);
  const texto = `Olá, ${nome}\n\nSua loja ${nomeLoja} está próxima do limite em: ${alertas.map(a => `${a.recurso} (${a.pct}%)`).join(", ")}.\n\nAcesse: ${linkPlano}`;
  return { assunto, html, texto };
}

export function upgradeSolicitadoConfirmacaoEmail(
  nome: string,
  nomeLoja: string,
): { assunto: string; html: string; texto: string } {
  const assunto = `Recebemos seu pedido de upgrade — ${APP_NAME}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:22px;color:#18181b;">Olá, ${nome}</h1>
    <p style="margin:0 0 12px;color:#52525b;line-height:1.5;">
      Recebemos o pedido de upgrade de plano da <strong>${nomeLoja}</strong>. Como o pagamento ainda
      é processado manualmente, nossa equipe vai entrar em contato em breve pelo e-mail ou WhatsApp
      cadastrado para combinar a forma de pagamento e ativar o novo plano.
    </p>
    <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
      Dúvidas? Responda este e-mail que falamos com você.
    </p>
  `);
  const texto = `Olá, ${nome}\n\nRecebemos o pedido de upgrade da ${nomeLoja}. Nossa equipe vai entrar em contato para combinar o pagamento e ativar o novo plano.`;
  return { assunto, html, texto };
}
