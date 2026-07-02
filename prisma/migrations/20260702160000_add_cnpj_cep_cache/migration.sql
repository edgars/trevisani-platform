-- Cache compartilhado da plataforma para consultas públicas (CNPJ / CEP)
CREATE TABLE "cnpj_cache" (
    "cnpj" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "consultadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cnpj_cache_pkey" PRIMARY KEY ("cnpj")
);

CREATE TABLE "cep_cache" (
    "cep" TEXT NOT NULL,
    "logradouro" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "consultadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cep_cache_pkey" PRIMARY KEY ("cep")
);
