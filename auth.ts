import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
});

// Tipo retornado pela query raw
type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string | null;
  imageUrl: string | null;
  tenantId: string | null;
  escopo: string;
  tenantSlug: string | null;
  papeis: string[];
  permissoes: string[];
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, senha } = parsed.data;

        // Query única com JOINs — substitui 4–5 round-trips Prisma por 1 só.
        // array_remove(..., NULL) descarta linhas sem papéis/permissões (LEFT JOIN).
        const rows = await prisma.$queryRaw<UsuarioRow[]>`
          SELECT
            u.id,
            u.nome,
            u.email,
            u."senhaHash",
            u."imageUrl",
            u."tenantId",
            u.escopo::text,
            t.slug                                              AS "tenantSlug",
            array_remove(array_agg(DISTINCT p.slug),  NULL)    AS papeis,
            array_remove(array_agg(DISTINCT pm.slug), NULL)    AS permissoes
          FROM   usuario u
          LEFT   JOIN tenant          t  ON t.id  = u."tenantId"
          LEFT   JOIN usuario_papel   up ON up."usuarioId" = u.id
          LEFT   JOIN papel           p  ON p.id  = up."papelId"
          LEFT   JOIN papel_permissao pp ON pp."papelId"   = p.id
          LEFT   JOIN permissao       pm ON pm.id = pp."permissaoId"
          WHERE  u.email = ${email}
            AND  u.ativo = true
          GROUP  BY u.id, u.nome, u.email, u."senhaHash", u."imageUrl",
                    u."tenantId", u.escopo, t.slug
          LIMIT  1
        `;

        const usuario = rows[0];
        if (!usuario?.senhaHash) return null;

        const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
        if (!senhaOk) return null;

        // Fire-and-forget: não bloqueia a autenticação; falha silenciosa.
        prisma.usuario
          .update({ where: { id: usuario.id }, data: { ultimoLoginEm: new Date() } })
          .catch(() => {});

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          image: usuario.imageUrl,
          tenantId: usuario.tenantId,
          tenantSlug: usuario.tenantSlug,
          escopo: usuario.escopo as any,
          papeis: usuario.papeis,
          permissoes: usuario.permissoes,
        };
      },
    }),
  ],
});
