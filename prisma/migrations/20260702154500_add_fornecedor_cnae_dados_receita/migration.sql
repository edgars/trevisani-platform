-- Dados da Receita Federal no fornecedor (consulta CNPJ via OpenCNPJ)
ALTER TABLE "fornecedor"
  ADD COLUMN "situacaoCadastral" TEXT,
  ADD COLUMN "naturezaJuridica" TEXT,
  ADD COLUMN "porteEmpresa" TEXT,
  ADD COLUMN "dataInicioAtividade" TIMESTAMP(3),
  ADD COLUMN "dadosCnpjJson" JSONB;

-- CNAEs do fornecedor PJ (principal + secundários)
CREATE TABLE "fornecedor_cnae" (
    "id" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fornecedor_cnae_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fornecedor_cnae_fornecedorId_codigo_key"
  ON "fornecedor_cnae"("fornecedorId", "codigo");

ALTER TABLE "fornecedor_cnae"
  ADD CONSTRAINT "fornecedor_cnae_fornecedorId_fkey"
  FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
