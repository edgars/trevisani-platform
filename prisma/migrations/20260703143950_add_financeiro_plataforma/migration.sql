-- CreateTable
CREATE TABLE "conta_bancaria_plataforma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "codigoBanco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipoConta" TEXT NOT NULL DEFAULT 'corrente',
    "pix" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conta_bancaria_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_plataforma" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "status" "StatusMovimentacao" NOT NULL DEFAULT 'PENDENTE',
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "dataCompetencia" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "formaPagamento" "FormaPagamento",
    "contaBancariaId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacao_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conta_bancaria_plataforma_ativo_idx" ON "conta_bancaria_plataforma"("ativo");

-- CreateIndex
CREATE INDEX "movimentacao_plataforma_tipo_status_idx" ON "movimentacao_plataforma"("tipo", "status");

-- CreateIndex
CREATE INDEX "movimentacao_plataforma_dataCompetencia_idx" ON "movimentacao_plataforma"("dataCompetencia");

-- AddForeignKey
ALTER TABLE "movimentacao_plataforma" ADD CONSTRAINT "movimentacao_plataforma_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "conta_bancaria_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
