import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  garantirPermissoesBase,
  provisionarPapeisPadraoTenant,
} from "../lib/tenant/papeis-padrao";

const prisma = new PrismaClient();

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

  // ─── Planos padrão (upsert preserva dados existentes de tenants) ──────────
  const planoGratis = await prisma.plano.upsert({
    where: { slug: "gratis" },
    update: {
      nome: "Grátis", precoMensalCentavos: 0, precoAnualCentavos: 0,
      limiteUsuarios: 1, limiteVeiculos: 10, limiteStorageMB: 512,
      limitePlacasMes: 10, limiteCnpjsMes: 5,
    },
    create: {
      nome: "Grátis", slug: "gratis",
      descricao: "Para começar sem custo: até 10 veículos, 10 consultas de placa/mês.",
      precoMensalCentavos: 0, precoAnualCentavos: 0,
      limiteUsuarios: 1, limiteVeiculos: 10, limiteStorageMB: 512,
      limitePlacasMes: 10, limiteCnpjsMes: 5,
      limiteIntegracoesJson: { assinatura: false, whatsapp: false, email: true },
    },
  });

  const planoStarter = await prisma.plano.upsert({
    where: { slug: "starter" },
    update: {
      nome: "Starter", precoMensalCentavos: 14900, precoAnualCentavos: 149000,
      limiteUsuarios: 2, limiteVeiculos: 30, limiteStorageMB: 2048,
      limitePlacasMes: 30, limiteCnpjsMes: 20,
    },
    create: {
      nome: "Starter", slug: "starter",
      descricao: "Para lojas pequenas: 30 veículos, 2 usuários, 30 consultas de placa/mês.",
      precoMensalCentavos: 14900, precoAnualCentavos: 149000,
      limiteUsuarios: 2, limiteVeiculos: 30, limiteStorageMB: 2048,
      limitePlacasMes: 30, limiteCnpjsMes: 20,
      limiteIntegracoesJson: { assinatura: false, whatsapp: false, email: true },
    },
  });

  const planoProfissional = await prisma.plano.upsert({
    where: { slug: "profissional" },
    update: {
      nome: "Profissional", precoMensalCentavos: 38900, precoAnualCentavos: 389000,
      limiteUsuarios: 5, limiteVeiculos: 150, limiteStorageMB: 10240,
      limitePlacasMes: 150, limiteCnpjsMes: 100,
    },
    create: {
      nome: "Profissional", slug: "profissional",
      descricao: "Para lojas em crescimento: DRE completo, 150 veículos, 5 usuários.",
      precoMensalCentavos: 38900, precoAnualCentavos: 389000,
      limiteUsuarios: 5, limiteVeiculos: 150, limiteStorageMB: 10240,
      limitePlacasMes: 150, limiteCnpjsMes: 100,
      limiteIntegracoesJson: { assinatura: true, whatsapp: false, email: true },
    },
  });

  const planoPremium = await prisma.plano.upsert({
    where: { slug: "premium" },
    update: {
      nome: "Premium", precoMensalCentavos: 74900, precoAnualCentavos: 749000,
      limiteUsuarios: 15, limiteVeiculos: 500, limiteStorageMB: 30720,
      limitePlacasMes: 500, limiteCnpjsMes: 300,
    },
    create: {
      nome: "Premium", slug: "premium",
      descricao: "Para lojas grandes: leilão habilitado, 500 veículos, 15 usuários.",
      precoMensalCentavos: 74900, precoAnualCentavos: 749000,
      limiteUsuarios: 15, limiteVeiculos: 500, limiteStorageMB: 30720,
      limitePlacasMes: 500, limiteCnpjsMes: 300,
      limiteIntegracoesJson: { assinatura: true, whatsapp: true, email: true },
      featuresJson: { leilao: true },
    },
  });

  const planoEnterprise = await prisma.plano.upsert({
    where: { slug: "enterprise" },
    update: {
      nome: "Enterprise", precoMensalCentavos: 140000, precoAnualCentavos: 1400000,
      limiteUsuarios: -1, limiteVeiculos: -1, limiteStorageMB: -1,
      limitePlacasMes: -1, limiteCnpjsMes: -1,
    },
    create: {
      nome: "Enterprise", slug: "enterprise",
      descricao: "Para grupos e concessionárias: tudo ilimitado, SLA dedicado.",
      precoMensalCentavos: 140000, precoAnualCentavos: 1400000,
      limiteUsuarios: -1, limiteVeiculos: -1, limiteStorageMB: -1,
      limitePlacasMes: -1, limiteCnpjsMes: -1,
      limiteIntegracoesJson: { assinatura: true, whatsapp: true, email: true },
      featuresJson: { leilao: true, multiSlug: true },
    },
  });

  // Keep the old "pro" slug pointing to Enterprise for backwards compatibility
  const planoPro = await prisma.plano.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      nome: "Pro (legado)", slug: "pro",
      descricao: "Plano legado — migrar para Enterprise.",
      precoMensalCentavos: 49900, precoAnualCentavos: 499000,
      limiteUsuarios: -1, limiteVeiculos: -1, limiteStorageMB: -1,
      limitePlacasMes: -1, limiteCnpjsMes: -1,
      limiteIntegracoesJson: { assinatura: true, whatsapp: true, email: true },
    },
  });

  console.log("Populando permissões...");
  await garantirPermissoesBase(prisma);

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
        emailVerified: new Date(),
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
  await provisionarPapeisPadraoTenant(prisma, tenant.id);

  console.log("Criando usuário admin do tenant demo...");
  const senhaTenant = await bcrypt.hash("demo@123", 10);
  const usuario = await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.com" } },
    update: { emailVerified: new Date() },
    create: {
      tenantId: tenant.id,
      escopo: "STAFF",
      nome: "Admin Demo",
      email: "admin@demo.com",
      senhaHash: senhaTenant,
      emailVerified: new Date(),
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
      facebook: "facebook.com/lojademo",
      youtube: "youtube.com/@lojademo",
      seoTitulo: "Loja Demo – Compra e Venda de Veículos",
      seoDescricao: "Encontre os melhores veículos na Loja Demo. Estoque sempre renovado, financiamento facilitado e atendimento personalizado.",
    },
  });

  console.log("\n✓ Seed concluído.");
  console.log(`  Plataforma: ${plataforma.nome}`);
  console.log(`  Planos: ${planoGratis.slug}, ${planoStarter.slug}, ${planoProfissional.slug}, ${planoPremium.slug}, ${planoEnterprise.slug}, ${planoPro.slug}`);
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
