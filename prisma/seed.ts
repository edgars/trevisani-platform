import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSOES_BASE = [
  // Tenant admin
  { slug: "tenant.gerenciar", modulo: "tenant", acao: "gerenciar" },
  { slug: "usuario.gerenciar", modulo: "usuario", acao: "gerenciar" },
  { slug: "papel.gerenciar", modulo: "papel", acao: "gerenciar" },
  { slug: "integracao.gerenciar", modulo: "integracao", acao: "gerenciar" },
  // Estoque
  { slug: "veiculo.criar", modulo: "veiculo", acao: "criar" },
  { slug: "veiculo.editar", modulo: "veiculo", acao: "editar" },
  { slug: "veiculo.remover", modulo: "veiculo", acao: "remover" },
  { slug: "veiculo.listar", modulo: "veiculo", acao: "listar" },
  // Compras
  { slug: "compra.criar", modulo: "compra", acao: "criar" },
  { slug: "compra.aprovar", modulo: "compra", acao: "aprovar" },
  { slug: "compra.listar", modulo: "compra", acao: "listar" },
  // Vendas
  { slug: "venda.criar", modulo: "venda", acao: "criar" },
  { slug: "venda.aprovar", modulo: "venda", acao: "aprovar" },
  { slug: "venda.listar", modulo: "venda", acao: "listar" },
  // Financeiro
  { slug: "financeiro.gerenciar", modulo: "financeiro", acao: "gerenciar" },
  { slug: "financeiro.visualizar", modulo: "financeiro", acao: "visualizar" },
  // Ofertas (fornecedor)
  { slug: "oferta.criar", modulo: "oferta", acao: "criar" },
  { slug: "oferta.listar", modulo: "oferta", acao: "listar" },
  // Documentos
  { slug: "documento.gerar", modulo: "documento", acao: "gerar" },
  { slug: "documento.assinar", modulo: "documento", acao: "assinar" },
] as const;

const PAPEIS_PADRAO: Array<{
  slug: string;
  nome: string;
  descricao: string;
  permissoes: string[];
}> = [
  {
    slug: "admin",
    nome: "Administrador",
    descricao: "Acesso total ao tenant.",
    permissoes: PERMISSOES_BASE.map((p) => p.slug),
  },
  {
    slug: "vendedor",
    nome: "Vendedor",
    descricao: "Cria propostas e vendas, consulta estoque.",
    permissoes: [
      "veiculo.listar",
      "venda.criar",
      "venda.listar",
      "documento.gerar",
      "financeiro.visualizar",
    ],
  },
  {
    slug: "comprador",
    nome: "Comprador",
    descricao: "Analisa ofertas de fornecedores e registra compras.",
    permissoes: [
      "veiculo.criar",
      "veiculo.editar",
      "veiculo.listar",
      "oferta.listar",
      "compra.criar",
      "compra.aprovar",
      "compra.listar",
    ],
  },
  {
    slug: "financeiro",
    nome: "Financeiro",
    descricao: "Gestão de pagamentos, despesas e conciliação.",
    permissoes: ["financeiro.gerenciar", "financeiro.visualizar"],
  },
];

async function main() {
  console.log("Populando plataforma...");

  const plataforma = await prisma.plataforma.upsert({
    where: { id: "plataforma-singleton" },
    update: {},
    create: {
      id: "plataforma-singleton",
      nome: "AutoGestão",
    },
  });

  const planoStarter = await prisma.plano.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      nome: "Starter",
      slug: "starter",
      descricao: "Ideal para lojas iniciantes: 3 usuários, 30 veículos.",
      precoMensalCentavos: 19900,
      precoAnualCentavos: 199900,
      limiteUsuarios: 3,
      limiteVeiculos: 30,
      limiteIntegracoesJson: {
        assinatura: false,
        whatsapp: false,
        email: true,
      },
    },
  });

  const planoPro = await prisma.plano.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      nome: "Pro",
      slug: "pro",
      descricao: "Loja em crescimento: usuários e veículos ilimitados.",
      precoMensalCentavos: 49900,
      precoAnualCentavos: 499900,
      limiteUsuarios: 999,
      limiteVeiculos: 9999,
      limiteIntegracoesJson: {
        assinatura: true,
        whatsapp: true,
        email: true,
      },
    },
  });

  console.log("Populando permissões...");
  for (const p of PERMISSOES_BASE) {
    await prisma.permissao.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log("Criando Super Admin...");
  const senhaAdmin = await bcrypt.hash("admin@123", 10);
  const existingSuperAdmin = await prisma.usuario.findFirst({
    where: { email: "admin@autogestao.com", escopo: "PLATAFORMA" },
  });
  if (!existingSuperAdmin) {
    await prisma.usuario.create({
      data: {
        escopo: "PLATAFORMA",
        nome: "Super Admin",
        email: "admin@autogestao.com",
        senhaHash: senhaAdmin,
      },
    });
  }

  console.log("Criando tenant demo...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      nome: "Loja Demo",
      razaoSocial: "Loja Demo LTDA",
      slug: "demo",
      status: "ATIVO",
      planoId: planoPro.id,
    },
  });

  console.log("Criando papéis padrão do tenant demo...");
  for (const p of PAPEIS_PADRAO) {
    const papel = await prisma.papel.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
      update: { nome: p.nome, descricao: p.descricao, sistemico: true },
      create: {
        tenantId: tenant.id,
        slug: p.slug,
        nome: p.nome,
        descricao: p.descricao,
        sistemico: true,
      },
    });
    for (const permSlug of p.permissoes) {
      const permissao = await prisma.permissao.findUnique({ where: { slug: permSlug } });
      if (permissao) {
        await prisma.papelPermissao.upsert({
          where: { papelId_permissaoId: { papelId: papel.id, permissaoId: permissao.id } },
          update: {},
          create: { papelId: papel.id, permissaoId: permissao.id },
        });
      }
    }
  }

  console.log("Criando usuário admin do tenant demo...");
  const senhaTenant = await bcrypt.hash("demo@123", 10);
  const usuario = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      escopo: "STAFF",
      nome: "Admin Demo",
      email: "admin@demo.com",
      senhaHash: senhaTenant,
    },
  });

  const papelAdmin = await prisma.papel.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "admin" } },
  });
  if (papelAdmin) {
    await prisma.usuarioPapel.upsert({
      where: { usuarioId_papelId: { usuarioId: usuario.id, papelId: papelAdmin.id } },
      update: {},
      create: { usuarioId: usuario.id, papelId: papelAdmin.id },
    });
  }

  console.log("Criando WebsiteConfig para o tenant demo...");
  await prisma.websiteConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      publicado: true,
      tema: "CLASSICO",
      corPrimaria: "#0f172a",
      corDestaque: "#e11d48",
      fonte: "INTER",
      heroTitulo: "Os melhores carros da região",
      heroSubtitulo: "Encontre o carro perfeito para você com as melhores condições.",
      sobre: "Somos a Loja Demo, uma revenda de confiança com anos de experiência no mercado automotivo. Nosso compromisso é oferecer veículos de qualidade com transparência e segurança.",
      telefone: "(11) 99999-0000",
      whatsapp: "5511999990000",
      endereco: "Av. Paulista, 1000 – São Paulo, SP",
      instagram: "lojademo",
      seoTitulo: "Loja Demo – Compra e Venda de Veículos",
      seoDescricao: "Encontre os melhores veículos na Loja Demo. Estoque sempre renovado, financiamento facilitado e atendimento personalizado.",
    },
  });

  console.log("\n✓ Seed concluído.");
  console.log(`  Plataforma: ${plataforma.nome}`);
  console.log(`  Planos: ${planoStarter.slug}, ${planoPro.slug}`);
  console.log(`  Tenant demo criado em /t/${tenant.slug}`);
  console.log(`  Super Admin  -> admin@autogestao.com / admin@123`);
  console.log(`  Admin tenant -> admin@demo.com / demo@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
