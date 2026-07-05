import { PrismaClient, StatusWpp, TipoMovimento, StatusMovimentacao, FormaPagamento } from "@prisma/client";
import { randomBytes } from "crypto";

import { CATEGORIAS_PADRAO } from "../lib/data/bancos";

const prisma = new PrismaClient();

type SeedResult = {
  created: number;
  reused: number;
};

const fornecedoresDemo = [
  { nome: "Auto Pecas Avenida", documento: "12111001000111", email: "contato@autopecasavenida.demo", telefone: "11940001001", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Pneus Premium Center", documento: "12111001000112", email: "vendas@pneuspremium.demo", telefone: "11940001002", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Funilaria Nova Era", documento: "12111001000113", email: "orcamento@funilarianovaera.demo", telefone: "11940001003", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Despachante Rapido", documento: "12111001000114", email: "atendimento@despachantrapido.demo", telefone: "11940001004", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Mecanica Torque Max", documento: "12111001000115", email: "oficina@torquemax.demo", telefone: "11940001005", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Estetica Auto Shine", documento: "12111001000116", email: "agenda@autoshine.demo", telefone: "11940001006", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Transportes Guindaste Sul", documento: "12111001000117", email: "operacao@guindastesul.demo", telefone: "11940001007", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Seguros Via Norte", documento: "12111001000118", email: "comercial@segurosvianorte.demo", telefone: "11940001008", cidade: "Sao Paulo", estado: "SP" },
  { nome: "CredCar Financeira", documento: "12111001000119", email: "parceiros@credcar.demo", telefone: "11940001009", cidade: "Sao Paulo", estado: "SP" },
  { nome: "Tecno Multimidia", documento: "12111001000120", email: "suporte@tecnomultimidia.demo", telefone: "11940001010", cidade: "Sao Paulo", estado: "SP" },
];

const clientesDemo = [
  { tipoPessoa: "PF" as const, nome: "Rafael Souza", documento: "92345011001", telefone: "11991000001", email: "rafael.souza@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Ana Carvalho", documento: "92345011002", telefone: "11991000002", email: "ana.carvalho@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Carlos Mendes", documento: "92345011003", telefone: "11991000003", email: "carlos.mendes@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Mariana Lima", documento: "92345011004", telefone: "11991000004", email: "mariana.lima@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Thiago Ferraz", documento: "92345011005", telefone: "11991000005", email: "thiago.ferraz@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Juliana Prado", documento: "92345011006", telefone: "11991000006", email: "juliana.prado@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Fernanda Costa", documento: "92345011007", telefone: "11991000007", email: "fernanda.costa@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Lucas Ramos", documento: "92345011008", telefone: "11991000008", email: "lucas.ramos@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Bruna Araujo", documento: "92345011009", telefone: "11991000009", email: "bruna.araujo@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Gabriel Nunes", documento: "92345011010", telefone: "11991000010", email: "gabriel.nunes@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Eduardo Silva", documento: "92345011011", telefone: "11991000011", email: "eduardo.silva@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Camila Duarte", documento: "92345011012", telefone: "11991000012", email: "camila.duarte@demo-mail.com" },
  { tipoPessoa: "PJ" as const, nome: "Logistica Serra Azul LTDA", documento: "45999001000101", telefone: "1132001001", email: "compras@serraazul.demo" },
  { tipoPessoa: "PJ" as const, nome: "Construtora Horizonte SA", documento: "45999001000102", telefone: "1132001002", email: "frota@horizonte.demo" },
  { tipoPessoa: "PJ" as const, nome: "Servicos Integrados Prime", documento: "45999001000103", telefone: "1132001003", email: "financeiro@prime.demo" },
  { tipoPessoa: "PJ" as const, nome: "Comercio Sol Nascente", documento: "45999001000104", telefone: "1132001004", email: "adm@solnascente.demo" },
  { tipoPessoa: "PF" as const, nome: "Patricia Gomes", documento: "92345011013", telefone: "11991000013", email: "patricia.gomes@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Roberto Paes", documento: "92345011014", telefone: "11991000014", email: "roberto.paes@demo-mail.com" },
  { tipoPessoa: "PF" as const, nome: "Isabela Nogueira", documento: "92345011015", telefone: "11991000015", email: "isabela.nogueira@demo-mail.com" },
];

function toDateDaysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureContaBancaria(tenantId: string, nome: string, banco: string, tipoConta: string, pix?: string): Promise<{ id: string }> {
  const existente = await prisma.contaBancaria.findFirst({
    where: { tenantId, nome },
    select: { id: true },
  });
  if (existente) return existente;
  return prisma.contaBancaria.create({
    data: { tenantId, nome, banco, tipoConta, pix: pix ?? null, ativo: true },
    select: { id: true },
  });
}

async function main() {
  console.log("Seed demo screenshots (append only)...");

  const tenant = await prisma.tenant.findUnique({
    where: { slug: "demo" },
    select: { id: true, nome: true },
  });

  if (!tenant) {
    throw new Error("Tenant 'demo' nao encontrado. Execute o seed principal antes.");
  }

  const resultFornecedoresClientes: SeedResult = { created: 0, reused: 0 };
  const resultFinanceiro: SeedResult = { created: 0, reused: 0 };
  const resultWhatsapp: SeedResult = { created: 0, reused: 0 };

  // ---------------------------------------------------------------------------
  // Fornecedores + Clientes (append / idempotente por documento)
  // ---------------------------------------------------------------------------
  for (const f of fornecedoresDemo) {
    const existente = await prisma.fornecedor.findUnique({
      where: { tenantId_documento: { tenantId: tenant.id, documento: f.documento } },
      select: { id: true },
    });
    if (existente) {
      resultFornecedoresClientes.reused += 1;
      continue;
    }
    await prisma.fornecedor.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: "PJ",
        nome: f.nome,
        razaoSocial: f.nome,
        documento: f.documento,
        email: f.email,
        telefone: f.telefone,
        cidade: f.cidade,
        estado: f.estado,
        ativo: true,
      },
    });
    resultFornecedoresClientes.created += 1;
  }

  for (const c of clientesDemo) {
    const existente = await prisma.clienteFinal.findUnique({
      where: { tenantId_documento: { tenantId: tenant.id, documento: c.documento } },
      select: { id: true },
    });
    if (existente) {
      resultFornecedoresClientes.reused += 1;
      continue;
    }
    await prisma.clienteFinal.create({
      data: {
        tenantId: tenant.id,
        tipoPessoa: c.tipoPessoa,
        nome: c.nome,
        documento: c.documento,
        telefone: c.telefone,
        email: c.email,
        tags: c.tipoPessoa === "PJ" ? ["frota-corporativa"] : ["lead-showroom"],
        consenteLgpd: true,
        ativo: true,
      },
    });
    resultFornecedoresClientes.created += 1;
  }

  // ---------------------------------------------------------------------------
  // Financeiro (contas + categorias + movimentacoes)
  // ---------------------------------------------------------------------------
  const contaCaixa = await ensureContaBancaria(tenant.id, "Caixa Loja (Demo)", "Caixa Interno", "caixa_interno");
  const contaBradesco = await ensureContaBancaria(tenant.id, "Conta Bradesco Demo", "Bradesco", "corrente", "11999990000");
  const contaItau = await ensureContaBancaria(tenant.id, "Conta Itau Demo", "Itau", "corrente");

  const categoriasByNome = new Map<string, { id: string; tipo: TipoMovimento }>();
  for (const categoria of CATEGORIAS_PADRAO) {
    const up = await prisma.categoriaFinanceira.upsert({
      where: { tenantId_nome: { tenantId: tenant.id, nome: categoria.nome } },
      update: { tipo: categoria.tipo, cor: categoria.cor, icone: categoria.icone, ativo: true },
      create: {
        tenantId: tenant.id,
        nome: categoria.nome,
        tipo: categoria.tipo,
        cor: categoria.cor,
        icone: categoria.icone,
        ativo: true,
      },
      select: { id: true, tipo: true },
    });
    categoriasByNome.set(categoria.nome, { id: up.id, tipo: up.tipo });
  }

  const fornecedoresIds = await prisma.fornecedor.findMany({
    where: { tenantId: tenant.id, documento: { in: fornecedoresDemo.map((f) => f.documento) } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const clientesIds = await prisma.clienteFinal.findMany({
    where: { tenantId: tenant.id, documento: { in: clientesDemo.map((c) => c.documento) } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const movimentosBase: Array<{
    descricao: string;
    tipo: TipoMovimento;
    status: StatusMovimentacao;
    valorCentavos: number;
    dataCompetencia: Date;
    dataVencimento?: Date;
    dataPagamento?: Date;
    formaPagamento?: FormaPagamento;
    categoriaNome: string;
    contaId?: string;
    clienteId?: string;
    fornecedorId?: string;
    observacoes?: string;
  }> = [];

  for (let i = 0; i < 12; i += 1) {
    movimentosBase.push({
      descricao: `DEMO-SEED | Receber showroom #${String(i + 1).padStart(2, "0")}`,
      tipo: "ENTRADA",
      status: "PENDENTE",
      valorCentavos: 180000 + i * 23500,
      dataCompetencia: toDateDaysFromNow(-10 + i),
      dataVencimento: toDateDaysFromNow(2 + i),
      categoriaNome: i % 2 === 0 ? "Entrada / Sinal" : "Venda de Veículo",
      clienteId: clientesIds[i % clientesIds.length]?.id,
      observacoes: "Conta a receber de proposta em andamento (demo).",
    });
  }

  for (let i = 0; i < 10; i += 1) {
    movimentosBase.push({
      descricao: `DEMO-SEED | Pagar operacao #${String(i + 1).padStart(2, "0")}`,
      tipo: "SAIDA",
      status: "PENDENTE",
      valorCentavos: 95000 + i * 17000,
      dataCompetencia: toDateDaysFromNow(-12 + i),
      dataVencimento: toDateDaysFromNow(1 + i),
      categoriaNome: i % 3 === 0 ? "Peças e Acessórios" : "Mão de Obra / Mecânica",
      fornecedorId: fornecedoresIds[i % fornecedoresIds.length]?.id,
      observacoes: "Despesa operacional planejada (demo).",
    });
  }

  for (let i = 0; i < 14; i += 1) {
    const dataCompetencia = toDateDaysFromNow(-35 + i * 2);
    const dataPagamento = new Date(dataCompetencia);
    dataPagamento.setDate(dataPagamento.getDate() + 1);
    movimentosBase.push({
      descricao: `DEMO-SEED | Entrada liquidada #${String(i + 1).padStart(2, "0")}`,
      tipo: "ENTRADA",
      status: "PAGO",
      valorCentavos: 220000 + i * 28000,
      dataCompetencia,
      dataVencimento: dataPagamento,
      dataPagamento,
      formaPagamento: i % 2 === 0 ? "PIX" : "TRANSFERENCIA",
      categoriaNome: i % 3 === 0 ? "Venda de Veículo" : "Outros Recebimentos",
      contaId: i % 2 === 0 ? contaBradesco.id : contaItau.id,
      clienteId: clientesIds[(i + 3) % clientesIds.length]?.id,
      observacoes: "Recebimento confirmado no caixa (demo).",
    });
  }

  for (let i = 0; i < 14; i += 1) {
    const dataCompetencia = toDateDaysFromNow(-30 + i * 2);
    const dataPagamento = new Date(dataCompetencia);
    dataPagamento.setDate(dataPagamento.getDate() + 1);
    movimentosBase.push({
      descricao: `DEMO-SEED | Saida liquidada #${String(i + 1).padStart(2, "0")}`,
      tipo: "SAIDA",
      status: "PAGO",
      valorCentavos: 110000 + i * 14000,
      dataCompetencia,
      dataVencimento: dataPagamento,
      dataPagamento,
      formaPagamento: i % 2 === 0 ? "BOLETO" : "PIX",
      categoriaNome: i % 4 === 0 ? "Marketing e Publicidade" : "Aluguel / Infraestrutura",
      contaId: i % 3 === 0 ? contaCaixa.id : contaBradesco.id,
      fornecedorId: fornecedoresIds[(i + 2) % fornecedoresIds.length]?.id,
      observacoes: "Pagamento operacional efetivado (demo).",
    });
  }

  for (const m of movimentosBase) {
    const categoria = categoriasByNome.get(m.categoriaNome);
    if (!categoria) continue;

    const existente = await prisma.movimentacao.findFirst({
      where: { tenantId: tenant.id, descricao: m.descricao },
      select: { id: true },
    });
    if (existente) {
      resultFinanceiro.reused += 1;
      continue;
    }

    await prisma.movimentacao.create({
      data: {
        tenantId: tenant.id,
        tipo: m.tipo,
        status: m.status,
        descricao: m.descricao,
        valorCentavos: m.valorCentavos,
        dataCompetencia: m.dataCompetencia,
        dataVencimento: m.dataVencimento ?? null,
        dataPagamento: m.dataPagamento ?? null,
        formaPagamento: m.formaPagamento ?? null,
        categoriaId: categoria.id,
        contaBancariaId: m.contaId ?? null,
        clienteId: m.clienteId ?? null,
        fornecedorId: m.fornecedorId ?? null,
        observacoes: m.observacoes ?? null,
      },
    });
    resultFinanceiro.created += 1;
  }

  // ---------------------------------------------------------------------------
  // Inbox WhatsApp fake (sem Evolution API)
  // ---------------------------------------------------------------------------
  const integracao = await prisma.integracaoWhatsApp.upsert({
    where: { tenantId: tenant.id },
    update: {
      instanceName: `loja-${tenant.id}`,
      status: StatusWpp.CONECTADO,
      numeroConectado: "5511999990000",
      qrCode: null,
      qrExpiresAt: null,
      criarLeadAuto: true,
    },
    create: {
      tenantId: tenant.id,
      instanceName: `loja-${tenant.id}`,
      status: StatusWpp.CONECTADO,
      numeroConectado: "5511999990000",
      webhookSecret: randomBytes(24).toString("hex"),
      criarLeadAuto: true,
    },
    select: { id: true },
  });

  const contatosWpp = [
    { nome: "Rafael Souza", remoteJid: "5511999100001@s.whatsapp.net", clienteDocumento: "92345011001" },
    { nome: "Ana Carvalho", remoteJid: "5511999100002@s.whatsapp.net", clienteDocumento: "92345011002" },
    { nome: "Carlos Mendes", remoteJid: "5511999100003@s.whatsapp.net", clienteDocumento: "92345011003" },
    { nome: "Mariana Lima", remoteJid: "5511999100004@s.whatsapp.net", clienteDocumento: "92345011004" },
    { nome: "Thiago Ferraz", remoteJid: "5511999100005@s.whatsapp.net", clienteDocumento: "92345011005" },
    { nome: "Juliana Prado", remoteJid: "5511999100006@s.whatsapp.net", clienteDocumento: "92345011006" },
    { nome: "Logistica Serra Azul", remoteJid: "5511332001001@s.whatsapp.net", clienteDocumento: "45999001000101" },
    { nome: "Construtora Horizonte", remoteJid: "5511332001002@s.whatsapp.net", clienteDocumento: "45999001000102" },
    { nome: "Servicos Prime", remoteJid: "5511332001003@s.whatsapp.net", clienteDocumento: "45999001000103" },
    { nome: "Patricia Gomes", remoteJid: "5511999100013@s.whatsapp.net", clienteDocumento: "92345011013" },
  ];

  for (let i = 0; i < contatosWpp.length; i += 1) {
    const contato = contatosWpp[i];
    const cliente = await prisma.clienteFinal.findUnique({
      where: { tenantId_documento: { tenantId: tenant.id, documento: contato.clienteDocumento } },
      select: { id: true },
    });

    const conversa = await prisma.conversaWpp.upsert({
      where: { integracaoId_remoteJid: { integracaoId: integracao.id, remoteJid: contato.remoteJid } },
      update: { nomeContato: contato.nome, clienteId: cliente?.id ?? null },
      create: {
        integracaoId: integracao.id,
        remoteJid: contato.remoteJid,
        nomeContato: contato.nome,
        clienteId: cliente?.id ?? null,
      },
      select: { id: true },
    });

    const textos = [
      "Oi! Esse carro ainda esta disponivel?",
      "Sim! Esta disponivel. Quer agendar visita hoje?",
      "Consigo ver ele as 16h?",
      "Consegue sim. Posso te mandar localizacao e detalhes.",
      "Perfeito, me manda por favor.",
      "Enviei. Qualquer duvida estou por aqui.",
      "Obrigado! Vou com minha esposa para avaliar.",
      "Combinado. Te espero na loja.",
    ];

    let ultimaMensagem = toDateDaysFromNow(-1);
    let totalNaoLidas = 0;

    for (let j = 0; j < textos.length; j += 1) {
      const fromMe = j % 2 === 1;
      const lida = fromMe ? true : j < textos.length - 2;
      const timestamp = new Date(Date.now() - (i * 6 + (textos.length - j)) * 60 * 60 * 1000);
      const messageId = `demo-msg-${i + 1}-${j + 1}`;
      if (!fromMe && !lida) totalNaoLidas += 1;
      ultimaMensagem = timestamp;

      const existingMsg = await prisma.mensagemWpp.findUnique({
        where: { conversaId_messageId: { conversaId: conversa.id, messageId } },
        select: { id: true },
      });

      if (existingMsg) {
        resultWhatsapp.reused += 1;
        continue;
      }

      await prisma.mensagemWpp.create({
        data: {
          conversaId: conversa.id,
          messageId,
          fromMe,
          tipo: "text",
          corpo: textos[j],
          lida,
          timestamp,
        },
      });
      resultWhatsapp.created += 1;
    }

    await prisma.conversaWpp.update({
      where: { id: conversa.id },
      data: { totalNaoLidas, ultimaMensagem },
    });
  }

  // ---------------------------------------------------------------------------
  // Resumo final (somente tenant demo)
  // ---------------------------------------------------------------------------
  const [countFornecedores, countClientes, countMovimentacoes, countConversas, countMensagens] = await Promise.all([
    prisma.fornecedor.count({ where: { tenantId: tenant.id } }),
    prisma.clienteFinal.count({ where: { tenantId: tenant.id } }),
    prisma.movimentacao.count({ where: { tenantId: tenant.id } }),
    prisma.conversaWpp.count({ where: { integracao: { tenantId: tenant.id } } }),
    prisma.mensagemWpp.count({ where: { conversa: { integracao: { tenantId: tenant.id } } } }),
  ]);

  console.log("");
  console.log(`Tenant alvo: demo (${tenant.nome})`);
  console.log("Resumo da execucao (append/idempotente):");
  console.log(`  Fornecedores + Clientes -> criados: ${resultFornecedoresClientes.created}, reaproveitados: ${resultFornecedoresClientes.reused}`);
  console.log(`  Financeiro              -> criados: ${resultFinanceiro.created}, reaproveitados: ${resultFinanceiro.reused}`);
  console.log(`  WhatsApp fake           -> criados: ${resultWhatsapp.created}, reaproveitados: ${resultWhatsapp.reused}`);
  console.log("");
  console.log("Contagens atuais no tenant demo:");
  console.log(`  Fornecedores: ${countFornecedores}`);
  console.log(`  Clientes:     ${countClientes}`);
  console.log(`  Movimentacoes:${countMovimentacoes}`);
  console.log(`  ConversasWpp: ${countConversas}`);
  console.log(`  MensagensWpp: ${countMensagens}`);
  console.log("");
  console.log("Concluido.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
