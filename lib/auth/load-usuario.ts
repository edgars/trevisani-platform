import type { EscopoUsuario } from "@prisma/client";

import { prisma } from "@/lib/db/client";

export type UsuarioAuth = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string | null;
  imageUrl: string | null;
  tenantId: string | null;
  escopo: EscopoUsuario;
  tenantSlug: string | null;
  papeis: string[];
  permissoes: string[];
};

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

export async function findUsuarioByEmail(email: string): Promise<UsuarioAuth | null> {
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
  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    senhaHash: usuario.senhaHash,
    imageUrl: usuario.imageUrl,
    tenantId: usuario.tenantId,
    escopo: usuario.escopo as EscopoUsuario,
    tenantSlug: usuario.tenantSlug,
    papeis: usuario.papeis,
    permissoes: usuario.permissoes,
  };
}

export function toAuthUser(usuario: UsuarioAuth) {
  return {
    id: usuario.id,
    name: usuario.nome,
    email: usuario.email,
    image: usuario.imageUrl,
    tenantId: usuario.tenantId,
    tenantSlug: usuario.tenantSlug,
    escopo: usuario.escopo,
    papeis: usuario.papeis,
    permissoes: usuario.permissoes,
  };
}

export function touchUltimoLogin(usuarioId: string): void {
  prisma.usuario
    .update({ where: { id: usuarioId }, data: { ultimoLoginEm: new Date() } })
    .catch(() => {});
}
