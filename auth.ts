import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
  tenantSlug: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, senha, tenantSlug } = parsed.data;

        // Se o tenantSlug foi fornecido, filtramos por tenant. Caso contrário,
        // procuramos um Super Admin (escopo = PLATAFORMA).
        const tenant = tenantSlug
          ? await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
          : null;

        const usuario = await prisma.usuario.findFirst({
          where: {
            email,
            ativo: true,
            ...(tenant ? { tenantId: tenant.id } : { tenantId: null, escopo: "PLATAFORMA" }),
          },
          include: {
            papeis: {
              include: {
                papel: {
                  include: { permissoes: { include: { permissao: true } } },
                },
              },
            },
          },
        });

        if (!usuario?.senhaHash) return null;
        const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaOk) return null;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimoLoginEm: new Date() },
        });

        const papeis = usuario.papeis.map((up) => up.papel.slug);
        const permissoes = Array.from(
          new Set(
            usuario.papeis.flatMap((up) =>
              up.papel.permissoes.map((pp) => pp.permissao.slug),
            ),
          ),
        );

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          image: usuario.imageUrl,
          tenantId: usuario.tenantId,
          escopo: usuario.escopo,
          papeis,
          permissoes,
        };
      },
    }),
  ],
});
