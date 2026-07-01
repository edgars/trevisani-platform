import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const [plataforma, planos, tenants, usuarios, papeis, permissoes] = await Promise.all([
  prisma.plataforma.findMany(),
  prisma.plano.findMany({ select: { slug: true, nome: true, precoMensalCentavos: true } }),
  prisma.tenant.findMany({ select: { slug: true, nome: true, status: true } }),
  prisma.usuario.findMany({ select: { email: true, escopo: true, tenantId: true, nome: true } }),
  prisma.papel.findMany({ select: { slug: true, nome: true, tenantId: true } }),
  prisma.permissao.count(),
]);

console.log(`Plataforma: ${plataforma.map((p) => p.nome).join(", ") || "(vazio)"}`);
console.log(`\nPlanos (${planos.length}):`);
planos.forEach((p) => console.log(`  - ${p.slug} (${p.nome}) R$ ${(p.precoMensalCentavos / 100).toFixed(2)}/mês`));
console.log(`\nTenants (${tenants.length}):`);
tenants.forEach((t) => console.log(`  - ${t.slug} (${t.nome}) [${t.status}]`));
console.log(`\nUsuários (${usuarios.length}):`);
usuarios.forEach((u) => console.log(`  - ${u.email} [${u.escopo}] tenantId=${u.tenantId ?? "null"}`));
console.log(`\nPapéis (${papeis.length}):`);
papeis.forEach((p) => console.log(`  - ${p.slug} (${p.nome})`));
console.log(`\nPermissões cadastradas: ${permissoes}`);

await prisma.$disconnect();
