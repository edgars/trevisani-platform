-- CreateEnum
CREATE TYPE "EscopoUsuario" AS ENUM ('STAFF', 'FORNECEDOR', 'CLIENTE', 'PLATAFORMA');

-- CreateEnum
CREATE TYPE "StatusTenant" AS ENUM ('ATIVO', 'SUSPENSO', 'TRIAL', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusAssinaturaPlataforma" AS ENUM ('ATIVA', 'INADIMPLENTE', 'CANCELADA', 'TRIAL');

-- CreateEnum
CREATE TYPE "StatusVeiculo" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO', 'EM_PREPARACAO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "CombustivelVeiculo" AS ENUM ('GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'GNV', 'HIBRIDO', 'ELETRICO');

-- CreateEnum
CREATE TYPE "CambioVeiculo" AS ENUM ('MANUAL', 'AUTOMATICO', 'AUTOMATIZADO', 'CVT');

-- CreateEnum
CREATE TYPE "OrigemVeiculo" AS ENUM ('COMPRA', 'CONSIGNACAO', 'TROCA');

-- CreateEnum
CREATE TYPE "StatusOferta" AS ENUM ('ENVIADA', 'EM_ANALISE', 'ACEITA', 'RECUSADA', 'CONVERTIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusCompra" AS ENUM ('RASCUNHO', 'AGUARDANDO_ASSINATURA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('RASCUNHO', 'PROPOSTA_ENVIADA', 'RESERVADA', 'AGUARDANDO_ASSINATURA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "StatusDespesa" AS ENUM ('ABERTA', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMovimento" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'FINANCIAMENTO', 'DINHEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('ABERTA', 'PAGA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusAssinaturaDoc" AS ENUM ('RASCUNHO', 'ENVIADO', 'PARCIALMENTE_ASSINADO', 'CONCLUIDO', 'CANCELADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "ProvedorAssinatura" AS ENUM ('DOCUSIGN', 'ZAPSIGN', 'CLICKSIGN', 'D4SIGN');

-- CreateEnum
CREATE TYPE "ProvedorEmail" AS ENUM ('RESEND', 'SMTP');

-- CreateEnum
CREATE TYPE "ProvedorWhatsapp" AS ENUM ('EVOLUTION', 'CLOUD_API');

-- CreateEnum
CREATE TYPE "TipoIntegracao" AS ENUM ('ASSINATURA', 'EMAIL', 'WHATSAPP', 'ARMAZENAMENTO', 'CONSULTA_VEICULAR');

-- CreateTable
CREATE TABLE "plataforma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dominio" TEXT,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "precoMensalCentavos" INTEGER NOT NULL DEFAULT 0,
    "precoAnualCentavos" INTEGER NOT NULL DEFAULT 0,
    "limiteUsuarios" INTEGER NOT NULL DEFAULT 5,
    "limiteVeiculos" INTEGER NOT NULL DEFAULT 50,
    "limiteIntegracoesJson" JSONB,
    "featuresJson" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinatura_plataforma" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "status" "StatusAssinaturaPlataforma" NOT NULL DEFAULT 'TRIAL',
    "cicloDias" INTEGER NOT NULL DEFAULT 30,
    "inicioAtual" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimAtual" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinatura_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "slug" TEXT NOT NULL,
    "dominio" TEXT,
    "logoUrl" TEXT,
    "status" "StatusTenant" NOT NULL DEFAULT 'TRIAL',
    "configJson" JSONB,
    "planoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "escopo" "EscopoUsuario" NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "imageUrl" TEXT,
    "fornecedorId" TEXT,
    "clienteId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLoginEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "papel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "sistemico" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "papel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissao" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "papel_permissao" (
    "papelId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,

    CONSTRAINT "papel_permissao_pkey" PRIMARY KEY ("papelId","permissaoId")
);

-- CreateTable
CREATE TABLE "usuario_papel" (
    "usuarioId" TEXT NOT NULL,
    "papelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_papel_pkey" PRIMARY KEY ("usuarioId","papelId")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'PJ',
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_final" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'PF',
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "consenteLgpd" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_final_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "placa" TEXT,
    "renavam" TEXT,
    "chassi" TEXT,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "versao" TEXT,
    "anoFabricacao" INTEGER NOT NULL,
    "anoModelo" INTEGER NOT NULL,
    "cor" TEXT,
    "combustivel" "CombustivelVeiculo",
    "cambio" "CambioVeiculo",
    "kmAtual" INTEGER,
    "categoria" TEXT,
    "situacaoDocumental" TEXT,
    "origem" "OrigemVeiculo" NOT NULL DEFAULT 'COMPRA',
    "precoCustoCentavos" INTEGER NOT NULL DEFAULT 0,
    "precoVendaCentavos" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusVeiculo" NOT NULL DEFAULT 'EM_PREPARACAO',
    "fornecedorId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto_veiculo" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferta_veiculo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "veiculoId" TEXT,
    "pacoteId" TEXT,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anoModelo" INTEGER NOT NULL,
    "kmAtual" INTEGER,
    "precoPretendidoCentavos" INTEGER NOT NULL,
    "observacoes" TEXT,
    "status" "StatusOferta" NOT NULL DEFAULT 'ENVIADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oferta_veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacote_oferta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "observacoes" TEXT,
    "status" "StatusOferta" NOT NULL DEFAULT 'ENVIADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacote_oferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataOperacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorTotalCentavos" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" "StatusCompra" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_compra" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "item_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venda" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataOperacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorTotalCentavos" INTEGER NOT NULL DEFAULT 0,
    "descontoCentavos" INTEGER NOT NULL DEFAULT 0,
    "entradaCentavos" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" "StatusVenda" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_venda" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "item_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_financeira" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3),
    "status" "StatusDespesa" NOT NULL DEFAULT 'ABERTA',
    "anexoUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL DEFAULT 'PIX',
    "categoriaId" TEXT,
    "compraId" TEXT,
    "vendaId" TEXT,
    "despesaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcela" (
    "id" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "status" "StatusParcela" NOT NULL DEFAULT 'ABERTA',

    CONSTRAINT "parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_documento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "conteudoHtml" TEXT NOT NULL,
    "variaveisJson" JSONB,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelo_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "modeloId" TEXT,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "compraId" TEXT,
    "vendaId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_assinatura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "provedor" "ProvedorAssinatura" NOT NULL,
    "envelopeExterno" TEXT,
    "status" "StatusAssinaturaDoc" NOT NULL DEFAULT 'RASCUNHO',
    "webhookIdempotencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fluxo_assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatario_assinatura" (
    "id" TEXT NOT NULL,
    "fluxoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "papel" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusAssinaturaDoc" NOT NULL DEFAULT 'RASCUNHO',
    "assinadoEm" TIMESTAMP(3),

    CONSTRAINT "signatario_assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracao_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoIntegracao" NOT NULL,
    "provedor" TEXT NOT NULL,
    "credencialCiph" TEXT NOT NULL,
    "configJson" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracao_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "para" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "erro" TEXT,
    "idempotencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_whatsapp" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "para" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "erro" TEXT,
    "idempotencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "lidaEm" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "usuarioId" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "acao" TEXT NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plano_nome_key" ON "plano"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "plano_slug_key" ON "plano"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_plataforma_tenantId_key" ON "assinatura_plataforma"("tenantId");

-- CreateIndex
CREATE INDEX "assinatura_plataforma_status_idx" ON "assinatura_plataforma"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_cnpj_key" ON "tenant"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_dominio_key" ON "tenant"("dominio");

-- CreateIndex
CREATE INDEX "tenant_status_idx" ON "tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_fornecedorId_key" ON "usuario"("fornecedorId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_clienteId_key" ON "usuario"("clienteId");

-- CreateIndex
CREATE INDEX "usuario_email_idx" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_tenantId_email_key" ON "usuario"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "papel_tenantId_slug_key" ON "papel"("tenantId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissao_slug_key" ON "permissao"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE INDEX "fornecedor_tenantId_nome_idx" ON "fornecedor"("tenantId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_tenantId_documento_key" ON "fornecedor"("tenantId", "documento");

-- CreateIndex
CREATE INDEX "cliente_final_tenantId_nome_idx" ON "cliente_final"("tenantId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_final_tenantId_documento_key" ON "cliente_final"("tenantId", "documento");

-- CreateIndex
CREATE INDEX "veiculo_tenantId_status_idx" ON "veiculo"("tenantId", "status");

-- CreateIndex
CREATE INDEX "veiculo_tenantId_marca_modelo_idx" ON "veiculo"("tenantId", "marca", "modelo");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_tenantId_chassi_key" ON "veiculo"("tenantId", "chassi");

-- CreateIndex
CREATE UNIQUE INDEX "veiculo_tenantId_placa_key" ON "veiculo"("tenantId", "placa");

-- CreateIndex
CREATE INDEX "foto_veiculo_veiculoId_ordem_idx" ON "foto_veiculo"("veiculoId", "ordem");

-- CreateIndex
CREATE INDEX "oferta_veiculo_tenantId_status_idx" ON "oferta_veiculo"("tenantId", "status");

-- CreateIndex
CREATE INDEX "pacote_oferta_tenantId_status_idx" ON "pacote_oferta"("tenantId", "status");

-- CreateIndex
CREATE INDEX "compra_tenantId_status_idx" ON "compra"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "compra_tenantId_numero_key" ON "compra"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "venda_tenantId_status_idx" ON "venda"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "venda_tenantId_numero_key" ON "venda"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_financeira_tenantId_nome_key" ON "categoria_financeira"("tenantId", "nome");

-- CreateIndex
CREATE INDEX "despesa_tenantId_status_idx" ON "despesa"("tenantId", "status");

-- CreateIndex
CREATE INDEX "pagamento_tenantId_tipo_idx" ON "pagamento"("tenantId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "parcela_pagamentoId_numero_key" ON "parcela"("pagamentoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "modelo_documento_tenantId_nome_versao_key" ON "modelo_documento"("tenantId", "nome", "versao");

-- CreateIndex
CREATE INDEX "documento_tenantId_idx" ON "documento"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_assinatura_documentoId_key" ON "fluxo_assinatura"("documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_assinatura_webhookIdempotencia_key" ON "fluxo_assinatura"("webhookIdempotencia");

-- CreateIndex
CREATE INDEX "fluxo_assinatura_tenantId_status_idx" ON "fluxo_assinatura"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integracao_config_tenantId_tipo_provedor_key" ON "integracao_config"("tenantId", "tipo", "provedor");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_idempotencia_key" ON "email_log"("idempotencia");

-- CreateIndex
CREATE INDEX "email_log_tenantId_createdAt_idx" ON "email_log"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mensagem_whatsapp_idempotencia_key" ON "mensagem_whatsapp"("idempotencia");

-- CreateIndex
CREATE INDEX "mensagem_whatsapp_tenantId_createdAt_idx" ON "mensagem_whatsapp"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "notificacao_tenantId_usuarioId_idx" ON "notificacao"("tenantId", "usuarioId");

-- CreateIndex
CREATE INDEX "audit_log_tenantId_entidade_createdAt_idx" ON "audit_log"("tenantId", "entidade", "createdAt");

-- AddForeignKey
ALTER TABLE "assinatura_plataforma" ADD CONSTRAINT "assinatura_plataforma_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinatura_plataforma" ADD CONSTRAINT "assinatura_plataforma_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente_final"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papel" ADD CONSTRAINT "papel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papel_permissao" ADD CONSTRAINT "papel_permissao_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papel_permissao" ADD CONSTRAINT "papel_permissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_papel" ADD CONSTRAINT "usuario_papel_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_papel" ADD CONSTRAINT "usuario_papel_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "papel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor" ADD CONSTRAINT "fornecedor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_final" ADD CONSTRAINT "cliente_final_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculo" ADD CONSTRAINT "veiculo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_veiculo" ADD CONSTRAINT "foto_veiculo_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_veiculo" ADD CONSTRAINT "oferta_veiculo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_veiculo" ADD CONSTRAINT "oferta_veiculo_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_veiculo" ADD CONSTRAINT "oferta_veiculo_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_veiculo" ADD CONSTRAINT "oferta_veiculo_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "pacote_oferta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_oferta" ADD CONSTRAINT "pacote_oferta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacote_oferta" ADD CONSTRAINT "pacote_oferta_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra" ADD CONSTRAINT "compra_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra" ADD CONSTRAINT "compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_compra" ADD CONSTRAINT "item_compra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_compra" ADD CONSTRAINT "item_compra_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "venda_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente_final"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "item_venda_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_financeira" ADD CONSTRAINT "categoria_financeira_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "despesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcela" ADD CONSTRAINT "parcela_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelo_documento" ADD CONSTRAINT "modelo_documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelo_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_assinatura" ADD CONSTRAINT "fluxo_assinatura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_assinatura" ADD CONSTRAINT "fluxo_assinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatario_assinatura" ADD CONSTRAINT "signatario_assinatura_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "fluxo_assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracao_config" ADD CONSTRAINT "integracao_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_whatsapp" ADD CONSTRAINT "mensagem_whatsapp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
