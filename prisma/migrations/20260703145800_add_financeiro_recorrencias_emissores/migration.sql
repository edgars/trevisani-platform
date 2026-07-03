-- CreateEnum
CREATE TYPE "TipoEmissorFinanceiro" AS ENUM ('EMPRESA', 'FUNCIONARIO', 'SOCIO');

-- AlterTable
ALTER TABLE "movimentacao_plataforma" ADD COLUMN     "emissorId" TEXT,
ADD COLUMN     "recorrenteId" TEXT;

-- CreateTable
CREATE TABLE "emissor_financeiro_plataforma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoEmissorFinanceiro" NOT NULL,
    "documento" TEXT,
    "contato" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emissor_financeiro_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_recorrente_plataforma" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "valorPadraoCentavos" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL DEFAULT 5,
    "formaPagamento" "FormaPagamento",
    "contaBancariaId" TEXT,
    "emissorId" TEXT,
    "observacoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacao_recorrente_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emissor_financeiro_plataforma_ativo_tipo_idx" ON "emissor_financeiro_plataforma"("ativo", "tipo");

-- CreateIndex
CREATE INDEX "movimentacao_recorrente_plataforma_ativa_idx" ON "movimentacao_recorrente_plataforma"("ativa");

-- CreateIndex
CREATE INDEX "movimentacao_plataforma_recorrenteId_idx" ON "movimentacao_plataforma"("recorrenteId");

-- AddForeignKey
ALTER TABLE "movimentacao_recorrente_plataforma" ADD CONSTRAINT "movimentacao_recorrente_plataforma_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "conta_bancaria_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_recorrente_plataforma" ADD CONSTRAINT "movimentacao_recorrente_plataforma_emissorId_fkey" FOREIGN KEY ("emissorId") REFERENCES "emissor_financeiro_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_plataforma" ADD CONSTRAINT "movimentacao_plataforma_emissorId_fkey" FOREIGN KEY ("emissorId") REFERENCES "emissor_financeiro_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_plataforma" ADD CONSTRAINT "movimentacao_plataforma_recorrenteId_fkey" FOREIGN KEY ("recorrenteId") REFERENCES "movimentacao_recorrente_plataforma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

