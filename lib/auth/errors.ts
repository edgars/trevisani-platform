import { CredentialsSignin } from "next-auth";

/**
 * Lançado pelo `authorize()` das Credentials quando a senha está correta mas
 * o e-mail ainda não foi confirmado. O `code` chega ao client via
 * `signIn(..., { redirect: false })` → `res.code`, permitindo mostrar uma
 * mensagem específica (com opção de reenviar o e-mail de confirmação).
 */
export class EmailNaoConfirmadoError extends CredentialsSignin {
  code = "email_nao_confirmado";
}
