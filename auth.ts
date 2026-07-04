import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/lib/auth/config";
import {
  findUsuarioByEmail,
  toAuthUser,
  touchUltimoLogin,
} from "@/lib/auth/load-usuario";
import { verifyLoginOtp } from "@/lib/auth/password-reset";
import { EmailNaoConfirmadoError } from "@/lib/auth/errors";

const credentialsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
});

const otpSchema = z.object({
  email: z.string().email(),
  codigo: z.string().length(6, "Código deve ter 6 dígitos"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, senha } = parsed.data;

        const usuario = await findUsuarioByEmail(email);
        if (!usuario?.senhaHash) return null;

        const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaOk) return null;

        if (!usuario.emailVerified) {
          throw new EmailNaoConfirmadoError();
        }

        touchUltimoLogin(usuario.id);
        return toAuthUser(usuario);
      },
    }),
    Credentials({
      id: "otp",
      name: "Código por e-mail",
      credentials: {
        email: { label: "E-mail", type: "email" },
        codigo: { label: "Código", type: "text" },
      },
      async authorize(raw) {
        const parsed = otpSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, codigo } = parsed.data;

        const valido = await verifyLoginOtp(email, codigo);
        if (!valido) return null;

        const usuario = await findUsuarioByEmail(email);
        if (!usuario) return null;

        touchUltimoLogin(usuario.id);
        return toAuthUser(usuario);
      },
    }),
  ],
});
